import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class ReplicasService {
  private replicas = 3;

  setReplicas(count: number) {
    this.replicas = count;
    exec(`kubectl scale deployment api --replicas=${count}`, (error) => {
      if (error) {
        console.error(`Scaling error: ${error.message}`);
      }
    });
    return { message: `Replicas set to ${count}` };
  }

  getReplicas() {
    return { replicas: this.replicas };
  }
}
