import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Portfolio')
@ApiBearerAuth()
@Controller('users/portfolio')
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get user portfolio' })
  async getUserPortfolio(@CurrentUser() user: User) {
    return this.portfolioService.getUserPortfolio(user.id);
  }
}
