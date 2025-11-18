import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';
import { Deposit } from './deposit.entity';
import { Withdrawal } from './withdrawal.entity';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @Column()
  user_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  locked_balance: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  @OneToMany(() => Deposit, (deposit) => deposit.wallet)
  deposits: Deposit[];

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.wallet)
  withdrawals: Withdrawal[];
}
