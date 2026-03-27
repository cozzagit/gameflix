import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('games')
  async listGames(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listGames(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Post('games')
  async createGame(
    @Body()
    dto: {
      slug: string;
      title: string;
      description?: string;
      categoryId: string;
      difficulty: number;
      thumbnailUrl?: string;
      bannerUrl?: string;
      estimatedDurationMin?: number;
      scoringType: 'POINTS' | 'TIME' | 'MOVES' | 'COMPLETION';
      supportsDaily?: boolean;
      config?: Record<string, unknown>;
      tags?: string[];
    },
  ) {
    return this.adminService.createGame(dto as any);
  }

  @Patch('games/:id')
  async updateGame(
    @Param('id') id: string,
    @Body()
    dto: {
      title?: string;
      description?: string;
      categoryId?: string;
      difficulty?: number;
      thumbnailUrl?: string;
      bannerUrl?: string;
      estimatedDurationMin?: number;
      scoringType?: 'POINTS' | 'TIME' | 'MOVES' | 'COMPLETION';
      supportsDaily?: boolean;
      config?: Record<string, unknown>;
      isPublished?: boolean;
      tags?: string[];
    },
  ) {
    return this.adminService.updateGame(id, dto as any);
  }

  @Delete('games/:id')
  async deleteGame(@Param('id') id: string) {
    return this.adminService.deleteGame(id);
  }

  @Post('releases')
  async scheduleRelease(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      gameId: string;
      scheduledAt: string;
      releaseType?: 'NEW' | 'UPDATE' | 'EVENT';
      announcement?: string;
      isFeatured?: boolean;
    },
  ) {
    return this.adminService.scheduleRelease(dto, user.sub);
  }
}
