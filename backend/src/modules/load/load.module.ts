import { Module } from '@nestjs/common';
import { LoadController } from './load.controller';
import { LoadService } from './load.service';
import { LoadGateway } from './load.gateway';

@Module({
  controllers: [LoadController],
  providers: [LoadService, LoadGateway],
  exports: [LoadGateway],
})
export class LoadModule {}
