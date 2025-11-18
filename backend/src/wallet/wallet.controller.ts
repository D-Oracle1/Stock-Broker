import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateDepositDto } from './dto/deposit.dto';
import { CreateWithdrawalDto } from './dto/withdrawal.dto';
import { AddBankAccountDto } from './dto/bank-account.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balance' })
  async getWallet(@CurrentUser() user: User) {
    return this.walletService.getWallet(user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(
    @CurrentUser() user: User,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.walletService.getTransactions(user.id, limit, offset);
  }

  @Post('deposit/create')
  @ApiOperation({ summary: 'Create deposit request' })
  async createDeposit(@CurrentUser() user: User, @Body() depositDto: CreateDepositDto) {
    return this.walletService.createDeposit(user.id, depositDto);
  }

  @Public()
  @Post('deposit/webhook')
  @ApiOperation({ summary: 'Payment gateway webhook' })
  async depositWebhook(@Body() webhookData: any) {
    // Verify webhook signature in production
    return this.walletService.verifyDeposit(webhookData.reference, webhookData);
  }

  @Get('deposits')
  @ApiOperation({ summary: 'Get deposit history' })
  async getDeposits(@CurrentUser() user: User) {
    return this.walletService.getDeposits(user.id);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Create withdrawal request' })
  async createWithdrawal(@CurrentUser() user: User, @Body() withdrawalDto: CreateWithdrawalDto) {
    return this.walletService.createWithdrawal(user.id, withdrawalDto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get withdrawal history' })
  async getWithdrawals(@CurrentUser() user: User) {
    return this.walletService.getWithdrawals(user.id);
  }

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Add bank account' })
  async addBankAccount(@CurrentUser() user: User, @Body() bankAccountDto: AddBankAccountDto) {
    return this.walletService.addBankAccount(user.id, bankAccountDto);
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'Get bank accounts' })
  async getBankAccounts(@CurrentUser() user: User) {
    return this.walletService.getBankAccounts(user.id);
  }
}
