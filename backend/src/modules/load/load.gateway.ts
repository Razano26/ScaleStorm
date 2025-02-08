import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } }) // 🔥 Ajoute CORS ici aussi
export class LoadGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Client WebSocket connecté: ${client.id}`); // ✅ DEBUG
  }

  handleDisconnect(client: any) {
    console.log(`Client WebSocket déconnecté: ${client.id}`); // ✅ DEBUG
  }

  sendResponseTime(responseTime: number) {
    console.log(`📡 Envoi du temps de réponse: ${responseTime}ms`); // ✅ DEBUG
    this.server.emit('responseTime', { responseTime });
  }
}
