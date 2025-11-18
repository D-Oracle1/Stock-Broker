import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AdminUser } from './admin-user.entity';

@Entity('admin_actions')
export class AdminAction extends BaseEntity {
  @Column()
  admin_id: string;

  @Column()
  action: string;

  @Column()
  entity_type: string;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: any;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @ManyToOne(() => AdminUser, (admin) => admin.actions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: AdminUser;
}
