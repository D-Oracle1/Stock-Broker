import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { Deposit, DepositStatus } from './entities/deposit.entity';
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity';
import { BankAccount } from './entities/bank-account.entity';
import { CreateDepositDto } from './dto/deposit.dto';
import { CreateWithdrawalDto } from './dto/withdrawal.dto';
import { AddBankAccountDto } from './dto/bank-account.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    private dataSource: DataSource,
  ) {}

  async getWallet(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { user_id: userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getTransactions(userId: string, limit = 50, offset = 0) {
    const wallet = await this.getWallet(userId);

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { wallet_id: wallet.id },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { transactions, total };
  }

  async createDeposit(userId: string, depositDto: CreateDepositDto) {
    const wallet = await this.getWallet(userId);
    const reference = `DEP-${uuidv4()}`;

    const deposit = this.depositRepository.create({
      wallet_id: wallet.id,
      amount: depositDto.amount,
      payment_method: depositDto.payment_method,
      reference,
      status: DepositStatus.PENDING,
    });

    await this.depositRepository.save(deposit);

    // Here you would integrate with Paystack/Flutterwave
    // For now, return a mock payment URL
    const paymentUrl = this.generatePaymentUrl(deposit);

    return {
      deposit,
      payment_url: paymentUrl,
      reference,
    };
  }

  async verifyDeposit(reference: string, paymentData: any) {
    const deposit = await this.depositRepository.findOne({
      where: { reference },
      relations: ['wallet'],
    });

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    if (deposit.status === DepositStatus.COMPLETED) {
      return { message: 'Deposit already processed' };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update deposit status
      deposit.status = DepositStatus.COMPLETED;
      deposit.payment_gateway_reference = paymentData.gateway_reference;
      deposit.payment_data = paymentData;
      deposit.confirmed_at = new Date();
      await queryRunner.manager.save(deposit);

      // Update wallet balance
      const wallet = deposit.wallet;
      const balanceBefore = Number(wallet.balance);
      wallet.balance = Number(wallet.balance) + Number(deposit.amount);
      await queryRunner.manager.save(wallet);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        wallet_id: wallet.id,
        type: TransactionType.DEPOSIT,
        amount: deposit.amount,
        balance_before: balanceBefore,
        balance_after: wallet.balance,
        status: TransactionStatus.COMPLETED,
        description: 'Deposit',
        reference: deposit.reference,
        metadata: paymentData,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return { message: 'Deposit confirmed successfully', wallet };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to process deposit');
    } finally {
      await queryRunner.release();
    }
  }

  async createWithdrawal(userId: string, withdrawalDto: CreateWithdrawalDto) {
    const wallet = await this.getWallet(userId);

    if (Number(wallet.balance) < withdrawalDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const bankAccount = await this.bankAccountRepository.findOne({
      where: { id: withdrawalDto.bank_account_id, user_id: userId },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    const fee = this.calculateWithdrawalFee(withdrawalDto.amount);
    const totalAmount = withdrawalDto.amount + fee;

    if (Number(wallet.balance) < totalAmount) {
      throw new BadRequestException('Insufficient balance including fees');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reference = `WTH-${uuidv4()}`;

      // Lock balance
      wallet.balance = Number(wallet.balance) - totalAmount;
      wallet.locked_balance = Number(wallet.locked_balance) + totalAmount;
      await queryRunner.manager.save(wallet);

      // Create withdrawal
      const withdrawal = this.withdrawalRepository.create({
        wallet_id: wallet.id,
        amount: withdrawalDto.amount,
        fee,
        bank_account_id: bankAccount.id,
        reference,
        status: WithdrawalStatus.PENDING,
      });
      await queryRunner.manager.save(withdrawal);

      await queryRunner.commitTransaction();

      return { withdrawal, message: 'Withdrawal request submitted' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create withdrawal');
    } finally {
      await queryRunner.release();
    }
  }

  async getDeposits(userId: string) {
    const wallet = await this.getWallet(userId);
    return this.depositRepository.find({
      where: { wallet_id: wallet.id },
      order: { created_at: 'DESC' },
    });
  }

  async getWithdrawals(userId: string) {
    const wallet = await this.getWallet(userId);
    return this.withdrawalRepository.find({
      where: { wallet_id: wallet.id },
      order: { created_at: 'DESC' },
    });
  }

  async addBankAccount(userId: string, bankAccountDto: AddBankAccountDto) {
    const bankAccount = this.bankAccountRepository.create({
      ...bankAccountDto,
      user_id: userId,
    });

    await this.bankAccountRepository.save(bankAccount);
    return bankAccount;
  }

  async getBankAccounts(userId: string) {
    return this.bankAccountRepository.find({
      where: { user_id: userId, is_active: true },
    });
  }

  private generatePaymentUrl(deposit: Deposit): string {
    // Mock payment URL - In production, integrate with Paystack/Flutterwave
    return `https://payment-gateway.com/pay?reference=${deposit.reference}&amount=${deposit.amount}`;
  }

  private calculateWithdrawalFee(amount: number): number {
    // Simple fee calculation: 1% or minimum $1
    const percentageFee = amount * 0.01;
    return Math.max(percentageFee, 1);
  }

  async creditWallet(
    walletId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: any,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, { where: { id: walletId } });
      const balanceBefore = Number(wallet.balance);
      wallet.balance = Number(wallet.balance) + Number(amount);
      await queryRunner.manager.save(wallet);

      const transaction = this.transactionRepository.create({
        wallet_id: walletId,
        type,
        amount,
        balance_before: balanceBefore,
        balance_after: wallet.balance,
        status: TransactionStatus.COMPLETED,
        description,
        metadata,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return wallet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async debitWallet(
    walletId: string,
    amount: number,
    type: TransactionType,
    description: string,
    metadata?: any,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, { where: { id: walletId } });

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const balanceBefore = Number(wallet.balance);
      wallet.balance = Number(wallet.balance) - Number(amount);
      await queryRunner.manager.save(wallet);

      const transaction = this.transactionRepository.create({
        wallet_id: walletId,
        type,
        amount,
        balance_before: balanceBefore,
        balance_after: wallet.balance,
        status: TransactionStatus.COMPLETED,
        description,
        metadata,
      });
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return wallet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
