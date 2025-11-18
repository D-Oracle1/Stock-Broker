import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycDocument } from './entities/kyc-document.entity';
import { User, KycStatus } from '../users/entities/user.entity';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycDocument)
    private kycRepository: Repository<KycDocument>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async submitKyc(userId: string, kycData: SubmitKycDto, files: any) {
    let kyc = await this.kycRepository.findOne({ where: { user_id: userId } });

    const documentData = {
      user_id: userId,
      front_id: files?.front_id?.[0]?.path || kycData.front_id,
      back_id: files?.back_id?.[0]?.path || kycData.back_id,
      selfie: files?.selfie?.[0]?.path || kycData.selfie,
      proof_of_address: files?.proof_of_address?.[0]?.path || kycData.proof_of_address,
      status: KycStatus.PENDING,
    };

    if (kyc) {
      await this.kycRepository.update(kyc.id, documentData);
    } else {
      kyc = this.kycRepository.create(documentData);
      await this.kycRepository.save(kyc);
    }

    await this.userRepository.update(userId, { kyc_status: KycStatus.PENDING });

    return { message: 'KYC documents submitted successfully', kyc };
  }

  async getKycStatus(userId: string) {
    const kyc = await this.kycRepository.findOne({ where: { user_id: userId } });
    return kyc || { status: KycStatus.NOT_STARTED };
  }

  async approveKyc(kycId: string, adminId: string) {
    const kyc = await this.kycRepository.findOne({ where: { id: kycId } });

    if (!kyc) {
      throw new NotFoundException('KYC document not found');
    }

    kyc.status = KycStatus.APPROVED;
    kyc.reviewed_by = adminId;
    kyc.reviewed_at = new Date();

    await this.kycRepository.save(kyc);
    await this.userRepository.update(kyc.user_id, { kyc_status: KycStatus.APPROVED });

    return { message: 'KYC approved successfully' };
  }

  async rejectKyc(kycId: string, adminId: string, reason: string) {
    const kyc = await this.kycRepository.findOne({ where: { id: kycId } });

    if (!kyc) {
      throw new NotFoundException('KYC document not found');
    }

    kyc.status = KycStatus.REJECTED;
    kyc.rejection_reason = reason;
    kyc.reviewed_by = adminId;
    kyc.reviewed_at = new Date();

    await this.kycRepository.save(kyc);
    await this.userRepository.update(kyc.user_id, { kyc_status: KycStatus.REJECTED });

    return { message: 'KYC rejected' };
  }
}
