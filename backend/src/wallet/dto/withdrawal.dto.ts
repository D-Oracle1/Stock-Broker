import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty({ example: 'bank-account-id' })
  @IsString()
  bank_account_id: string;
}
