import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class LoadGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client déconnecté: ${client.id}`);
  }

  sendResponseTime(responseTime: number) {
    this.server.emit('responseTime', { responseTime });
  }
}
