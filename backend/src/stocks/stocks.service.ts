import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { StockCategory } from './entities/stock-category.entity';
import { MarketPrice } from './entities/market-price.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockCategory)
    private categoryRepository: Repository<StockCategory>,
    @InjectRepository(MarketPrice)
    private priceRepository: Repository<MarketPrice>,
  ) {}

  async getAllStocks(category?: string, search?: string) {
    const where: any = { is_active: true };

    if (category) {
      const cat = await this.categoryRepository.findOne({ where: { slug: category } });
      if (cat) where.category_id = cat.id;
    }

    if (search) {
      return this.stockRepository.find({
        where: [
          { ...where, symbol: Like(`%${search}%`) },
          { ...where, name: Like(`%${search}%`) },
        ],
        relations: ['category'],
        order: { symbol: 'ASC' },
      });
    }

    return this.stockRepository.find({
      where,
      relations: ['category'],
      order: { symbol: 'ASC' },
    });
  }

  async getStock(symbol: string) {
    const stock = await this.stockRepository.findOne({
      where: { symbol: symbol.toUpperCase() },
      relations: ['category'],
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    }

    return stock;
  }

  async getStockHistory(symbol: string, period = '1D') {
    const stock = await this.getStock(symbol);

    const periodMap = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '1Y': 365,
    };

    const days = periodMap[period] || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const prices = await this.priceRepository.find({
      where: { stock_id: stock.id },
      order: { timestamp: 'ASC' },
      take: 1000,
    });

    return { stock, prices };
  }

  async getAllCategories() {
    return this.categoryRepository.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  // Mock market data update - In production, integrate with real market data API
  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateMarketPrices() {
    const stocks = await this.stockRepository.find({ where: { is_active: true } });

    for (const stock of stocks) {
      // Simulate price change (-2% to +2%)
      const change = (Math.random() - 0.5) * 0.04;
      const currentPrice = Number(stock.current_price) || 100;
      const newPrice = currentPrice * (1 + change);

      stock.current_price = Number(newPrice.toFixed(2));
      stock.change_amount = Number((newPrice - currentPrice).toFixed(2));
      stock.change_percent = Number((change * 100).toFixed(2));
      stock.last_updated = new Date();

      await this.stockRepository.save(stock);

      // Save historical price
      const marketPrice = this.priceRepository.create({
        stock_id: stock.id,
        price: stock.current_price,
        open: stock.opening_price,
        high: stock.high_price || stock.current_price,
        low: stock.low_price || stock.current_price,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date(),
      });

      await this.priceRepository.save(marketPrice);
    }
  }
}
