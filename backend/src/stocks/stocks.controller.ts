import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StocksService } from './stocks.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Stocks')
@Controller('stocks')
export class StocksController {
  constructor(private stocksService: StocksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all stocks' })
  async getAllStocks(@Query('category') category?: string, @Query('search') search?: string) {
    return this.stocksService.getAllStocks(category, search);
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getAllCategories() {
    return this.stocksService.getAllCategories();
  }

  @Public()
  @Get(':symbol')
  @ApiOperation({ summary: 'Get stock by symbol' })
  async getStock(@Param('symbol') symbol: string) {
    return this.stocksService.getStock(symbol);
  }

  @Public()
  @Get(':symbol/history')
  @ApiOperation({ summary: 'Get stock price history' })
  async getStockHistory(@Param('symbol') symbol: string, @Query('period') period?: string) {
    return this.stocksService.getStockHistory(symbol, period);
  }
}
