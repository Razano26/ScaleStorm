import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoadGateway } from './load.gateway';

@Injectable()
export class LoadService implements OnModuleInit {
  private rps = 0; // Nombre de requêtes par seconde

  constructor(private readonly loadGateway: LoadGateway) {}

  onModuleInit() {
    setInterval(() => {
      const simulatedResponseTime = Math.floor(Math.random() * 200) + 50; // Simule une latence de 50-250ms
      console.log(`📡 Simulation : Envoi de ${simulatedResponseTime}ms`);
      this.loadGateway.sendResponseTime(simulatedResponseTime);
    }, 3000); // Envoie toutes les 3 secondes
  }

  setLoad(rps: number) {
    this.rps = rps;
    return { message: `Load set to ${rps} RPS` };
  }

  getLoad() {
    return { rps: this.rps };
  }
}
