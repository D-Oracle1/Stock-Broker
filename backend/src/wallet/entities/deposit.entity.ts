import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Wallet } from './wallet.entity';

export enum DepositStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('deposits')
export class Deposit extends BaseEntity {
  @Column()
  wallet_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.PENDING })
  status: DepositStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  payment_method: PaymentMethod;

  @Column({ unique: true })
  reference: string;

  @Column({ nullable: true })
  payment_gateway_reference: string;

  @Column({ type: 'jsonb', nullable: true })
  payment_data: any;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.deposits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
}
