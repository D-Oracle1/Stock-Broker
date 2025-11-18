import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './entities/admin-user.entity';
import { AdminRole } from './entities/admin-role.entity';
import { AdminAction } from './entities/admin-action.entity';
import { User } from '../users/entities/user.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { StockCategory } from '../stocks/entities/stock-category.entity';
import { Deposit } from '../wallet/entities/deposit.entity';
import { Withdrawal } from '../wallet/entities/withdrawal.entity';
import { KycService } from '../kyc/kyc.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminUser)
    private adminRepository: Repository<AdminUser>,
    @InjectRepository(AdminRole)
    private roleRepository: Repository<AdminRole>,
    @InjectRepository(AdminAction)
    private actionRepository: Repository<AdminAction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockCategory)
    private categoryRepository: Repository<StockCategory>,
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    private jwtService: JwtService,
    private kycService: KycService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.adminRepository.findOne({
      where: { email, is_active: true },
      relations: ['role'],
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    admin.last_login = new Date();
    await this.adminRepository.save(admin);

    const token = this.jwtService.sign(
      { sub: admin.id, email: admin.email, role: admin.role.name },
      { secret: process.env.JWT_SECRET, expiresIn: '8h' },
    );

    return {
      access_token: token,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role.name,
        permissions: admin.role.permissions,
      },
    };
  }

  async getAllUsers(page = 1, limit = 50) {
    const [users, total] = await this.userRepository.findAndCount({
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async getUserDetails(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet', 'kyc_document'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(adminId: string, userId: string, is_active: boolean) {
    await this.userRepository.update(userId, { is_active });
    await this.logAction(adminId, 'UPDATE_USER_STATUS', 'User', userId, { is_active });
    return { message: 'User status updated' };
  }

  async createStock(adminId: string, stockData: any) {
    const stock = this.stockRepository.create(stockData);
    await this.stockRepository.save(stock);
    await this.logAction(adminId, 'CREATE_STOCK', 'Stock', stock.id, stockData);
    return stock;
  }

  async updateStock(adminId: string, stockId: string, updateData: any) {
    await this.stockRepository.update(stockId, updateData);
    await this.logAction(adminId, 'UPDATE_STOCK', 'Stock', stockId, updateData);
    return this.stockRepository.findOne({ where: { id: stockId } });
  }

  async deleteStock(adminId: string, stockId: string) {
    const stock = await this.stockRepository.findOne({ where: { id: stockId } });
    if (!stock) {
      throw new NotFoundException('Stock not found');
    }
    await this.stockRepository.update(stockId, { is_active: false, is_tradeable: false });
    await this.logAction(adminId, 'DELETE_STOCK', 'Stock', stockId, null);
    return { message: 'Stock deactivated' };
  }

  async createCategory(adminId: string, categoryData: any) {
    const category = this.categoryRepository.create(categoryData);
    await this.categoryRepository.save(category);
    await this.logAction(adminId, 'CREATE_CATEGORY', 'StockCategory', category.id, categoryData);
    return category;
  }

  async updateCategory(adminId: string, categoryId: string, updateData: any) {
    await this.categoryRepository.update(categoryId, updateData);
    await this.logAction(adminId, 'UPDATE_CATEGORY', 'StockCategory', categoryId, updateData);
    return this.categoryRepository.findOne({ where: { id: categoryId } });
  }

  async getAllDeposits(page = 1, limit = 50) {
    const [deposits, total] = await this.depositRepository.findAndCount({
      relations: ['wallet', 'wallet.user'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { deposits, total, page, pages: Math.ceil(total / limit) };
  }

  async getAllWithdrawals(page = 1, limit = 50) {
    const [withdrawals, total] = await this.withdrawalRepository.findAndCount({
      relations: ['wallet', 'wallet.user'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { withdrawals, total, page, pages: Math.ceil(total / limit) };
  }

  async getAuditLogs(page = 1, limit = 100) {
    const [logs, total] = await this.actionRepository.findAndCount({
      relations: ['admin'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { logs, total, page, pages: Math.ceil(total / limit) };
  }

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { is_active: true } });
    const totalStocks = await this.stockRepository.count();
    const activeStocks = await this.stockRepository.count({
      where: { is_active: true, is_tradeable: true },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      stocks: {
        total: totalStocks,
        active: activeStocks,
      },
    };
  }

  private async logAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes: any,
  ) {
    const log = this.actionRepository.create({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes,
    });

    await this.actionRepository.save(log);
  }
}
