import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('portfolios')
@Index(['user_id', 'stock_symbol'], { unique: true })
export class Portfolio extends BaseEntity {
  @Column()
  user_id: string;

  @Column()
  stock_symbol: string;

  @Column()
  stock_name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  average_buy_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total_invested: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  current_value: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unrealized_pnl: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unrealized_pnl_percent: number;

  @Column({ type: 'timestamp', nullable: true })
  last_updated: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
