import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebsocketGateway } from './websocket.gateway';
import { Stock } from '../stocks/entities/stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock])],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
