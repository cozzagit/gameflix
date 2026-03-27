import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { GameQueryDto } from './dto/game-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  async findAll(@Query() query: GameQueryDto) {
    return this.gamesService.findAll(query);
  }

  @Get('category/:categorySlug')
  async findByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.gamesService.findByCategory(
      categorySlug,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.gamesService.findBySlug(slug);
  }

  @Post(':slug/play')
  @UseGuards(JwtAuthGuard)
  async registerPlay(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gamesService.registerPlay(slug, user.sub);
  }
}
