import { Controller, Post, Body, Get } from '@nestjs/common';
import { ReplicasService } from './replicas.service';

@Controller('api/replicas')
export class ReplicasController {
  constructor(private readonly replicasService: ReplicasService) {}

  @Post()
  setReplicas(@Body('count') count: number) {
    return this.replicasService.setReplicas(count);
  }

  @Get()
  getReplicas() {
    return this.replicasService.getReplicas();
  }
}
