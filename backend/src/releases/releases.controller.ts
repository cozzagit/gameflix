import { Controller, Get, Query } from '@nestjs/common';
import { ReleasesService } from './releases.service';

@Controller('releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get('upcoming')
  async getUpcoming(@Query('limit') limit?: number) {
    return this.releasesService.getUpcoming(limit ? Number(limit) : 10);
  }

  @Get('recent')
  async getRecent(@Query('limit') limit?: number) {
    return this.releasesService.getRecent(limit ? Number(limit) : 10);
  }
}
