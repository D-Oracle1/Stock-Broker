import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { User } from '../users/entities/user.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Wallet } from '../wallet/entities/wallet.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepository: Repository<UserSession>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = this.userRepository.create({
      ...registerDto,
      password_hash: hashedPassword,
      is_active: true,
    });

    await this.userRepository.save(user);

    // Create wallet for user
    const wallet = this.walletRepository.create({
      user_id: user.id,
      balance: 0,
      locked_balance: 0,
    });

    await this.walletRepository.save(wallet);

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
      },
    };
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    // Check 2FA
    if (user.two_fa_enabled) {
      if (!loginDto.twofa_token) {
        throw new BadRequestException('2FA token required');
      }

      const isValid = authenticator.verify({
        token: loginDto.twofa_token,
        secret: user.two_fa_secret,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA token');
      }
    }

    // Update login info
    user.last_login = new Date();
    user.last_login_ip = ipAddress;
    user.failed_login_attempts = 0;
    await this.userRepository.save(user);

    const tokens = await this.generateTokens(user);
    await this.createSession(user.id, tokens.refresh_token, ipAddress, userAgent);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        kyc_status: user.kyc_status,
        two_fa_enabled: user.two_fa_enabled,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      user.failed_login_attempts += 1;
      if (user.failed_login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      await this.userRepository.save(user);
      return null;
    }

    return user;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const session = await this.sessionRepository.findOne({
        where: { refresh_token: refreshToken, is_active: true },
        relations: ['user'],
      });

      if (!session || session.expires_at < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(session.user);

      // Update session with new refresh token
      session.refresh_token = tokens.refresh_token;
      session.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.sessionRepository.save(session);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.sessionRepository.update(
      { user_id: userId, refresh_token: refreshToken },
      { is_active: false },
    );

    return { message: 'Logged out successfully' };
  }

  async enable2FA(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'StockBroker', secret);

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    user.two_fa_secret = secret;
    await this.userRepository.save(user);

    return {
      secret,
      qr_code: qrCode,
    };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.two_fa_secret) {
      throw new BadRequestException('2FA not initialized');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.two_fa_secret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid token');
    }

    user.two_fa_enabled = true;
    await this.userRepository.save(user);

    return { message: '2FA enabled successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const access_token = this.jwtService.sign(
      { ...payload, type: 'access' },
      { secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    );

    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
    );

    return { access_token, refresh_token };
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const session = this.sessionRepository.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await this.sessionRepository.save(session);
  }
}
