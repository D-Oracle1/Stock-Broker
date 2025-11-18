import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Exclude } from 'class-transformer';
import { AdminRole } from './admin-role.entity';
import { AdminAction } from './admin-action.entity';

@Entity('admin_users')
export class AdminUser extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password_hash: string;

  @Column()
  full_name: string;

  @Column()
  role_id: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @ManyToOne(() => AdminRole, (role) => role.admins, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role: AdminRole;

  @OneToMany(() => AdminAction, (action) => action.admin)
  actions: AdminAction[];
}
