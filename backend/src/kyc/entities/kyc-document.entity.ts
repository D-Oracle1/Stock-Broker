import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User, KycStatus } from '../../users/entities/user.entity';

@Entity('kyc_documents')
export class KycDocument extends BaseEntity {
  @Column()
  user_id: string;

  @Column({ nullable: true })
  front_id: string;

  @Column({ nullable: true })
  back_id: string;

  @Column({ nullable: true })
  selfie: string;

  @Column({ nullable: true })
  proof_of_address: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ nullable: true })
  reviewed_by: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToOne(() => User, (user) => user.kyc_document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
