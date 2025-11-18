import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Stock } from './stock.entity';

@Entity('market_prices')
@Index(['stock_id', 'timestamp'])
export class MarketPrice extends BaseEntity {
  @Column()
  stock_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  open: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  high: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  low: number;

  @Column({ type: 'bigint' })
  volume: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => Stock, (stock) => stock.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
