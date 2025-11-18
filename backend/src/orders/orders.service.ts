import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Order, OrderStatus, OrderSide, OrderType } from './entities/order.entity';
import { Trade } from './entities/trade.entity';
import { OrderFill } from './entities/order-fill.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { TransactionType } from '../wallet/entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(OrderFill)
    private fillRepository: Repository<OrderFill>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectQueue('orders')
    private ordersQueue: Queue,
    private walletService: WalletService,
    private dataSource: DataSource,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const stock = await this.stockRepository.findOne({
      where: { symbol: createOrderDto.stock_symbol.toUpperCase(), is_active: true },
    });

    if (!stock || !stock.is_tradeable) {
      throw new NotFoundException('Stock not found or not tradeable');
    }

    const wallet = await this.walletRepository.findOne({ where: { user_id: userId } });

    // Validate order
    const price = createOrderDto.type === OrderType.MARKET
      ? stock.current_price
      : createOrderDto.price;

    const totalAmount = Number(price) * createOrderDto.quantity;

    if (createOrderDto.side === OrderSide.BUY) {
      if (Number(wallet.balance) < totalAmount) {
        throw new BadRequestException('Insufficient balance');
      }
    } else {
      // Validate holdings for sell order
      const portfolio = await this.portfolioRepository.findOne({
        where: { user_id: userId, stock_symbol: stock.symbol },
      });

      if (!portfolio || Number(portfolio.quantity) < createOrderDto.quantity) {
        throw new BadRequestException('Insufficient stock holdings');
      }
    }

    // Create order
    const order = this.orderRepository.create({
      user_id: userId,
      stock_id: stock.id,
      type: createOrderDto.type,
      side: createOrderDto.side,
      quantity: createOrderDto.quantity,
      price: createOrderDto.type === OrderType.LIMIT ? createOrderDto.price : null,
      status: OrderStatus.PENDING,
      total_amount: totalAmount,
      fee: totalAmount * 0.001, // 0.1% fee
    });

    await this.orderRepository.save(order);

    // Add to processing queue
    await this.ordersQueue.add('process-order', { orderId: order.id });

    return order;
  }

  async processOrder(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['stock', 'user'],
    });

    if (!order || order.status !== OrderStatus.PENDING) {
      return;
    }

    order.status = OrderStatus.PROCESSING;
    await this.orderRepository.save(order);

    try {
      await this.executeOrder(order);
    } catch (error) {
      order.status = OrderStatus.REJECTED;
      order.rejection_reason = error.message;
      await this.orderRepository.save(order);
    }
  }

  private async executeOrder(order: Order) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const stock = await queryRunner.manager.findOne(Stock, { where: { id: order.stock_id } });
      const wallet = await queryRunner.manager.findOne(Wallet, { where: { user_id: order.user_id } });

      const executionPrice = order.type === OrderType.MARKET
        ? Number(stock.current_price)
        : Number(order.price);

      const totalAmount = executionPrice * Number(order.quantity);
      const totalWithFee = totalAmount + Number(order.fee);

      if (order.side === OrderSide.BUY) {
        // Deduct from wallet
        if (Number(wallet.balance) < totalWithFee) {
          throw new BadRequestException('Insufficient balance');
        }

        wallet.balance = Number(wallet.balance) - totalWithFee;
        await queryRunner.manager.save(wallet);

        // Update or create portfolio
        let portfolio = await queryRunner.manager.findOne(Portfolio, {
          where: { user_id: order.user_id, stock_symbol: stock.symbol },
        });

        if (portfolio) {
          const totalInvested = Number(portfolio.total_invested) + totalAmount;
          const totalQuantity = Number(portfolio.quantity) + Number(order.quantity);
          portfolio.average_buy_price = totalInvested / totalQuantity;
          portfolio.quantity = totalQuantity;
          portfolio.total_invested = totalInvested;
        } else {
          portfolio = queryRunner.manager.create(Portfolio, {
            user_id: order.user_id,
            stock_symbol: stock.symbol,
            stock_name: stock.name,
            quantity: order.quantity,
            average_buy_price: executionPrice,
            total_invested: totalAmount,
          });
        }

        await queryRunner.manager.save(portfolio);
      } else {
        // SELL
        const portfolio = await queryRunner.manager.findOne(Portfolio, {
          where: { user_id: order.user_id, stock_symbol: stock.symbol },
        });

        if (!portfolio || Number(portfolio.quantity) < Number(order.quantity)) {
          throw new BadRequestException('Insufficient holdings');
        }

        // Credit wallet
        wallet.balance = Number(wallet.balance) + totalAmount - Number(order.fee);
        await queryRunner.manager.save(wallet);

        // Update portfolio
        portfolio.quantity = Number(portfolio.quantity) - Number(order.quantity);
        portfolio.total_invested = Number(portfolio.average_buy_price) * Number(portfolio.quantity);

        if (portfolio.quantity === 0) {
          await queryRunner.manager.remove(portfolio);
        } else {
          await queryRunner.manager.save(portfolio);
        }
      }

      // Create trade record
      const trade = queryRunner.manager.create(Trade, {
        order_id: order.id,
        user_id: order.user_id,
        stock_symbol: stock.symbol,
        quantity: order.quantity,
        price: executionPrice,
        total_amount: totalAmount,
        fee: order.fee,
        side: order.side,
        executed_at: new Date(),
      });

      await queryRunner.manager.save(trade);

      // Update order
      order.status = OrderStatus.FILLED;
      order.filled_quantity = order.quantity;
      order.average_price = executionPrice;
      order.filled_at = new Date();
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.find({
      where: { user_id: userId },
      relations: ['stock'],
      order: { created_at: 'DESC' },
    });
  }

  async getUserTrades(userId: string) {
    return this.tradeRepository.find({
      where: { user_id: userId },
      order: { executed_at: 'DESC' },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user_id: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelled_at = new Date();
    await this.orderRepository.save(order);

    return { message: 'Order cancelled successfully' };
  }
}
