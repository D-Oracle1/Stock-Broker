import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('bank_accounts')
export class BankAccount extends BaseEntity {
  @Column()
  user_id: string;

  @Column()
  account_name: string;

  @Column()
  account_number: string;

  @Column()
  bank_name: string;

  @Column({ nullable: true })
  bank_code: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_verified: boolean;

  @ManyToOne(() => User, (user) => user.bank_accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
