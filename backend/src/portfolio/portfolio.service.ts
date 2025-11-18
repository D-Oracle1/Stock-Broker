import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async getUserPortfolio(userId: string) {
    const holdings = await this.portfolioRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalUnrealizedPnL = 0;

    for (const holding of holdings) {
      totalInvested += Number(holding.total_invested);
      totalCurrentValue += Number(holding.current_value);
      totalUnrealizedPnL += Number(holding.unrealized_pnl);
    }

    return {
      holdings,
      summary: {
        total_invested: totalInvested,
        total_current_value: totalCurrentValue,
        total_unrealized_pnl: totalUnrealizedPnL,
        total_unrealized_pnl_percent: totalInvested > 0
          ? ((totalUnrealizedPnL / totalInvested) * 100).toFixed(2)
          : 0,
      },
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updatePortfolioPrices() {
    const portfolios = await this.portfolioRepository.find();

    for (const portfolio of portfolios) {
      const stock = await this.stockRepository.findOne({
        where: { symbol: portfolio.stock_symbol },
      });

      if (stock) {
        const currentValue = Number(stock.current_price) * Number(portfolio.quantity);
        const unrealizedPnL = currentValue - Number(portfolio.total_invested);
        const unrealizedPnLPercent = Number(portfolio.total_invested) > 0
          ? (unrealizedPnL / Number(portfolio.total_invested)) * 100
          : 0;

        portfolio.current_value = currentValue;
        portfolio.unrealized_pnl = unrealizedPnL;
        portfolio.unrealized_pnl_percent = Number(unrealizedPnLPercent.toFixed(2));
        portfolio.last_updated = new Date();

        await this.portfolioRepository.save(portfolio);
      }
    }
  }
}
