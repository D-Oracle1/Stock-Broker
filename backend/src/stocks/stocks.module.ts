import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { Stock } from './entities/stock.entity';
import { StockCategory } from './entities/stock-category.entity';
import { MarketPrice } from './entities/market-price.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, StockCategory, MarketPrice])],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService],
})
export class StocksModule {}
