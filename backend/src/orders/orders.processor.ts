import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { OrdersService } from './orders.service';

@Processor('orders')
export class OrdersProcessor {
  constructor(private ordersService: OrdersService) {}

  @Process('process-order')
  async handleProcessOrder(job: Job) {
    const { orderId } = job.data;
    await this.ordersService.processOrder(orderId);
  }
}
