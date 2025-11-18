import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUser } from './entities/admin-user.entity';
import { AdminRole } from './entities/admin-role.entity';
import { AdminAction } from './entities/admin-action.entity';
import { User } from '../users/entities/user.entity';
import { Stock } from '../stocks/entities/stock.entity';
import { StockCategory } from '../stocks/entities/stock-category.entity';
import { Deposit } from '../wallet/entities/deposit.entity';
import { Withdrawal } from '../wallet/entities/withdrawal.entity';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      AdminRole,
      AdminAction,
      User,
      Stock,
      StockCategory,
      Deposit,
      Withdrawal,
    ]),
    JwtModule.register({}),
    KycModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
