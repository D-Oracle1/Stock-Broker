import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.adminService.login(loginDto.email, loginDto.password);
  }

  @ApiBearerAuth()
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @ApiBearerAuth()
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllUsers(page, limit);
  }

  @ApiBearerAuth()
  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @ApiBearerAuth()
  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body('is_active') is_active: boolean,
    @Body('admin_id') adminId: string,
  ) {
    return this.adminService.updateUserStatus(adminId, userId, is_active);
  }

  @ApiBearerAuth()
  @Post('stocks')
  @ApiOperation({ summary: 'Create stock' })
  async createStock(@Body() stockData: any) {
    return this.adminService.createStock(stockData.admin_id, stockData);
  }

  @ApiBearerAuth()
  @Patch('stocks/:id')
  @ApiOperation({ summary: 'Update stock' })
  async updateStock(@Param('id') stockId: string, @Body() updateData: any) {
    return this.adminService.updateStock(updateData.admin_id, stockId, updateData);
  }

  @ApiBearerAuth()
  @Delete('stocks/:id')
  @ApiOperation({ summary: 'Delete stock' })
  async deleteStock(@Param('id') stockId: string, @Body('admin_id') adminId: string) {
    return this.adminService.deleteStock(adminId, stockId);
  }

  @ApiBearerAuth()
  @Post('categories')
  @ApiOperation({ summary: 'Create category' })
  async createCategory(@Body() categoryData: any) {
    return this.adminService.createCategory(categoryData.admin_id, categoryData);
  }

  @ApiBearerAuth()
  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(@Param('id') categoryId: string, @Body() updateData: any) {
    return this.adminService.updateCategory(updateData.admin_id, categoryId, updateData);
  }

  @ApiBearerAuth()
  @Get('deposits')
  @ApiOperation({ summary: 'Get all deposits' })
  async getAllDeposits(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllDeposits(page, limit);
  }

  @ApiBearerAuth()
  @Get('withdrawals')
  @ApiOperation({ summary: 'Get all withdrawals' })
  async getAllWithdrawals(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllWithdrawals(page, limit);
  }

  @ApiBearerAuth()
  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAuditLogs(page, limit);
  }
}
