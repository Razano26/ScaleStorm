import { Controller, Post, Body } from '@nestjs/common';
import { AutoScaleService } from './autoscale.service';

@Controller('api/autoscale')
export class AutoScaleController {
  constructor(private readonly autoScaleService: AutoScaleService) {}

  @Post()
  toggleAutoScale(@Body('enabled') enabled: boolean) {
    return this.autoScaleService.toggleAutoScaling(enabled);
  }
}
