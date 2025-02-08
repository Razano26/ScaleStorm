import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class ReplicasService {
  private replicas = 3;

  setReplicas(count: number) {
    console.log(`🚀 Mise à jour des réplicas à : ${count}`); // ✅ DEBUG
    this.replicas = count;

    exec(`kubectl scale deployment api --replicas=${count}`, (error) => {
      if (error) {
        console.error(`❌ Erreur scaling: ${error.message}`);
      }
    });

    return { message: `Replicas set to ${count}` };
  }

  getReplicas() {
    return { replicas: this.replicas };
  }
}
