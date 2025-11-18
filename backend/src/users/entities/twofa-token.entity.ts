import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('twofa_tokens')
export class TwoFAToken extends BaseEntity {
  @Column()
  user_id: string;

  @Column()
  token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  is_used: boolean;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date;

  @ManyToOne(() => User, (user) => user.twofa_tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
