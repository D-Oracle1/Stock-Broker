import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../stocks/entities/stock.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private subscriptions: Map<string, Set<string>> = new Map();

  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Clean up subscriptions
    this.subscriptions.forEach((clients) => {
      clients.delete(client.id);
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { symbol: string }) {
    const { symbol } = payload;
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol).add(client.id);
    client.join(`stock:${symbol}`);
    console.log(`Client ${client.id} subscribed to ${symbol}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { symbol: string }) {
    const { symbol } = payload;
    if (this.subscriptions.has(symbol)) {
      this.subscriptions.get(symbol).delete(client.id);
    }
    client.leave(`stock:${symbol}`);
    console.log(`Client ${client.id} unsubscribed from ${symbol}`);
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async broadcastPriceUpdates() {
    const stocks = await this.stockRepository.find({
      where: { is_active: true },
    });

    const updates = stocks.map((stock) => ({
      symbol: stock.symbol,
      price: stock.current_price,
      change: stock.change_amount,
      change_percent: stock.change_percent,
      volume: stock.volume,
      timestamp: new Date(),
    }));

    // Broadcast to all connected clients
    this.server.emit('market:update', updates);

    // Broadcast individual stock updates
    stocks.forEach((stock) => {
      this.server.to(`stock:${stock.symbol}`).emit('price:update', {
        symbol: stock.symbol,
        price: stock.current_price,
        change: stock.change_amount,
        change_percent: stock.change_percent,
        volume: stock.volume,
        high: stock.high_price,
        low: stock.low_price,
        timestamp: new Date(),
      });
    });
  }

  emitOrderUpdate(userId: string, order: any) {
    this.server.to(`user:${userId}`).emit('order:update', order);
  }

  emitTradeUpdate(userId: string, trade: any) {
    this.server.to(`user:${userId}`).emit('trade:update', trade);
  }
}
