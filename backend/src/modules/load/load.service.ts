import { Injectable } from '@nestjs/common';

@Injectable()
export class LoadService {
  private rps = 0; // Nombre de requêtes par seconde

  setLoad(rps: number) {
    this.rps = rps;
    return { message: `Load set to ${rps} RPS` };
  }

  getLoad() {
    return { rps: this.rps };
  }
}
