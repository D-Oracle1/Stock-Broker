import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderType, OrderSide } from '../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ example: 'AAPL' })
  @IsString()
  stock_symbol: string;

  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ enum: OrderSide })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 150.50, required: false })
  @IsNumber()
  @Min(0)
  price?: number;
}
