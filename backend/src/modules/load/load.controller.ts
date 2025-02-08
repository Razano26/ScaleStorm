import { Controller, Post, Body, Get } from '@nestjs/common';
import { LoadService } from './load.service';

@Controller('api/load')
export class LoadController {
  constructor(private readonly loadService: LoadService) {}

  @Post()
  setLoad(@Body('rps') rps: number) {
    return this.loadService.setLoad(rps);
  }

  @Get()
  getLoad() {
    return this.loadService.getLoad();
  }
}
