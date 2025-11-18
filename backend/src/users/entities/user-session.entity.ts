import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession extends BaseEntity {
  @Column()
  user_id: string;

  @Column({ type: 'text' })
  refresh_token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column()
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
