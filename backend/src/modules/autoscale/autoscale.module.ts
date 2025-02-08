import { Module } from '@nestjs/common';
import { AutoScaleController } from './autoscale.controller';
import { AutoScaleService } from './autoscale.service';

@Module({
  controllers: [AutoScaleController],
  providers: [AutoScaleService],
})
export class AutoScaleModule {}
