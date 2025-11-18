import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AdminUser } from './admin-user.entity';

@Entity('admin_roles')
export class AdminRole extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: {} })
  permissions: Record<string, boolean>;

  @Column({ default: false })
  is_super_admin: boolean;

  @OneToMany(() => AdminUser, (admin) => admin.role)
  admins: AdminUser[];
}
