import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersProcessor } from './orders.processor';
import { Order } from './entities/order.entity';
import { Trade } from './entities/trade.entity';
import { OrderFill } from './entities/order-fill.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Trade, OrderFill, Stock, Wallet, Portfolio]),
    BullModule.registerQueue({
      name: 'orders',
    }),
    WalletModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
