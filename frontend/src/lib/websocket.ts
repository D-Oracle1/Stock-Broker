import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    }

    return this.socket;
  }

  subscribe(symbol: string) {
    if (this.socket) {
      this.socket.emit('subscribe', { symbol });
    }
  }

  unsubscribe(symbol: string) {
    if (this.socket) {
      this.socket.emit('unsubscribe', { symbol });
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const wsService = new WebSocketService();
