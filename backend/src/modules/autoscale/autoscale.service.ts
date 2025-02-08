import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class AutoScaleService {
  toggleAutoScaling(enabled: boolean) {
    const command = enabled
      ? `kubectl apply -f hpa.yaml`
      : `kubectl delete hpa api`;

    exec(command, (error) => {
      if (error) {
        console.error(`HPA toggle error: ${error.message}`);
      }
    });

    return { message: `Autoscaling ${enabled ? 'enabled' : 'disabled'}` };
  }
}
