import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wallet', 'kyc_document'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.findOne(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      dob: user.dob,
      kyc_status: user.kyc_status,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      two_fa_enabled: user.two_fa_enabled,
      created_at: user.created_at,
    };
  }

  async updateProfile(userId: string, updateData: Partial<User>) {
    await this.userRepository.update(userId, updateData);
    return this.getProfile(userId);
  }
}
