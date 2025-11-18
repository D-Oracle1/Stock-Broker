import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { StockCategory } from './stock-category.entity';
import { MarketPrice } from './market-price.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('stocks')
export class Stock extends BaseEntity {
  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column()
  category_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  current_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  opening_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  high_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  low_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  previous_close: number;

  @Column({ type: 'bigint', default: 0 })
  volume: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  change_percent: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  change_amount: number;

  @Column({ type: 'bigint', nullable: true })
  market_cap: number;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  is_tradeable: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_updated: Date;

  @ManyToOne(() => StockCategory, (category) => category.stocks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: StockCategory;

  @OneToMany(() => MarketPrice, (price) => price.stock)
  prices: MarketPrice[];

  @OneToMany(() => Order, (order) => order.stock)
  orders: Order[];
}
