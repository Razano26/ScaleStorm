import { Module } from '@nestjs/common';
import { LoadModule } from './modules/load/load.module';
import { ReplicasModule } from './modules/replicas/replicas.module';
import { AutoScaleModule } from './modules/autoscale/autoscale.module';

@Module({
  imports: [LoadModule, ReplicasModule, AutoScaleModule],
})
export class AppModule {}
