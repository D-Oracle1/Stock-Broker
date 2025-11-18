import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exclude } from 'class-transformer';
import { UserSession } from './user-session.entity';
import { TwoFAToken } from './twofa-token.entity';
import { KycDocument } from '../../kyc/entities/kyc-document.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Order } from '../../orders/entities/order.entity';
import { BankAccount } from '../../wallet/entities/bank-account.entity';

export enum KycStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  @Exclude()
  password_hash: string;

  @Column()
  full_name: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.NOT_STARTED })
  kyc_status: KycStatus;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ default: false })
  phone_verified: boolean;

  @Column({ default: false })
  is_active: boolean;

  @Column({ default: false })
  two_fa_enabled: boolean;

  @Column({ nullable: true })
  @Exclude()
  two_fa_secret: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @Column({ nullable: true })
  last_login_ip: string;

  @Column({ default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToMany(() => TwoFAToken, (token) => token.user)
  twofa_tokens: TwoFAToken[];

  @OneToOne(() => KycDocument, (kyc) => kyc.user)
  kyc_document: KycDocument;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => BankAccount, (account) => account.user)
  bank_accounts: BankAccount[];
}
