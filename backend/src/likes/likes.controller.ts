import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':gameSlug')
  @UseGuards(JwtAuthGuard)
  async toggleLike(
    @CurrentUser() user: JwtPayload,
    @Param('gameSlug') gameSlug: string,
  ) {
    return this.likesService.toggleLike(user.sub, gameSlug);
  }

  @Delete(':gameSlug')
  @UseGuards(JwtAuthGuard)
  async removeLike(
    @CurrentUser() user: JwtPayload,
    @Param('gameSlug') gameSlug: string,
  ) {
    return this.likesService.removeLike(user.sub, gameSlug);
  }

  @Get(':gameSlug/status')
  @UseGuards(JwtAuthGuard)
  async getLikeStatus(
    @CurrentUser() user: JwtPayload,
    @Param('gameSlug') gameSlug: string,
  ) {
    return this.likesService.getUserLikeStatus(user.sub, gameSlug);
  }
}
