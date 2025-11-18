import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  async createOrder(@CurrentUser() user: User, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  async getUserOrders(@CurrentUser() user: User) {
    return this.ordersService.getUserOrders(user.id);
  }

  @Get('trades')
  @ApiOperation({ summary: 'Get user trades' })
  async getUserTrades(@CurrentUser() user: User) {
    return this.ordersService.getUserTrades(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(@CurrentUser() user: User, @Param('id') orderId: string) {
    return this.ordersService.cancelOrder(user.id, orderId);
  }
}
