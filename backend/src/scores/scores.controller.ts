import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ScoresService } from './scores.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async submitScore(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitScoreDto,
  ) {
    return this.scoresService.submitScore(user.sub, dto);
  }

  @Get('leaderboard/:gameSlug')
  async getLeaderboard(
    @Param('gameSlug') gameSlug: string,
    @Query() query: LeaderboardQueryDto,
  ) {
    return this.scoresService.getLeaderboard(gameSlug, query);
  }

  @Get('rank/:gameSlug')
  @UseGuards(JwtAuthGuard)
  async getUserRank(
    @CurrentUser() user: JwtPayload,
    @Param('gameSlug') gameSlug: string,
    @Query('period') period?: string,
  ) {
    return this.scoresService.getUserRank(user.sub, gameSlug, period);
  }

  @Get('nearby/:gameSlug')
  @UseGuards(JwtAuthGuard)
  async getNearbyPlayers(
    @CurrentUser() user: JwtPayload,
    @Param('gameSlug') gameSlug: string,
  ) {
    return this.scoresService.getNearbyPlayers(user.sub, gameSlug);
  }
}
