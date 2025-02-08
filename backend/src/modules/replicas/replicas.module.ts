import { Module } from '@nestjs/common';
import { ReplicasController } from './replicas.controller';
import { ReplicasService } from './replicas.service';

@Module({
  controllers: [ReplicasController],
  providers: [ReplicasService],
})
export class ReplicasModule {}
