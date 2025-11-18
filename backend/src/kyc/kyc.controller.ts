import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('KYC')
@ApiBearerAuth()
@Controller('users/kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  @Post()
  @ApiOperation({ summary: 'Submit KYC documents' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'front_id', maxCount: 1 },
        { name: 'back_id', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
        { name: 'proof_of_address', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/kyc',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}-${file.originalname}`);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      },
    ),
  )
  async submitKyc(
    @CurrentUser() user: User,
    @Body() submitKycDto: SubmitKycDto,
    @UploadedFiles() files: any,
  ) {
    return this.kycService.submitKyc(user.id, submitKycDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get KYC status' })
  async getKycStatus(@CurrentUser() user: User) {
    return this.kycService.getKycStatus(user.id);
  }
}
