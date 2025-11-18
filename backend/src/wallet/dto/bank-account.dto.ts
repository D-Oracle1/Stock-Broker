import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddBankAccountDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  account_name: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  account_number: string;

  @ApiProperty({ example: 'First Bank' })
  @IsString()
  bank_name: string;

  @ApiProperty({ example: '011', required: false })
  @IsString()
  bank_code?: string;
}
