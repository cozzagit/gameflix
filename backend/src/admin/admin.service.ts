import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ScoringType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateGameDto {
  slug: string;
  title: string;
  description?: string;
  categoryId: string;
  difficulty: number;
  thumbnailUrl?: string;
  bannerUrl?: string;
  estimatedDurationMin?: number;
  scoringType: ScoringType;
  supportsDaily?: boolean;
  config?: Prisma.InputJsonValue;
  tags?: string[];
}

interface UpdateGameDto {
  title?: string;
  description?: string;
  categoryId?: string;
  difficulty?: number;
  thumbnailUrl?: string;
  bannerUrl?: string;
  estimatedDurationMin?: number;
  scoringType?: ScoringType;
  supportsDaily?: boolean;
  config?: Prisma.InputJsonValue;
  isPublished?: boolean;
  tags?: string[];
}

interface ScheduleReleaseDto {
  gameId: string;
  scheduledAt: string;
  releaseType?: 'NEW' | 'UPDATE' | 'EVENT';
  announcement?: string;
  isFeatured?: boolean;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalGames,
      publishedGames,
      totalScores,
      activeSubscriptions,
      recentUsers,
      topGames,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.game.count(),
      this.prisma.game.count({ where: { isPublished: true } }),
      this.prisma.score.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.game.findMany({
        where: { isPublished: true },
        orderBy: { totalPlays: 'desc' },
        take: 5,
        select: {
          id: true,
          slug: true,
          title: true,
          totalPlays: true,
          totalLikes: true,
          avgRating: true,
          activePlayers: true,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        recentWeek: recentUsers,
      },
      games: {
        total: totalGames,
        published: publishedGames,
      },
      scores: {
        total: totalScores,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      topGames,
    };
  }

  async createGame(dto: CreateGameDto) {
    const game = await this.prisma.game.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        difficulty: dto.difficulty,
        thumbnailUrl: dto.thumbnailUrl,
        bannerUrl: dto.bannerUrl,
        estimatedDurationMin: dto.estimatedDurationMin,
        scoringType: dto.scoringType,
        supportsDaily: dto.supportsDaily ?? false,
        config: dto.config ?? undefined,
      },
    });

    if (dto.tags && dto.tags.length > 0) {
      await this.prisma.gameTag.createMany({
        data: dto.tags.map((tag) => ({
          gameId: game.id,
          tag,
        })),
      });
    }

    return this.prisma.game.findUnique({
      where: { id: game.id },
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: true } },
      },
    });
  }

  async updateGame(gameId: string, dto: UpdateGameDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (dto.tags !== undefined) {
      await this.prisma.gameTag.deleteMany({ where: { gameId } });
      if (dto.tags.length > 0) {
        await this.prisma.gameTag.createMany({
          data: dto.tags.map((tag) => ({
            gameId,
            tag,
          })),
        });
      }
    }

    const { tags: _tags, categoryId, ...updateData } = dto;

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        ...updateData,
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        ...(dto.isPublished && !game.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: true } },
      },
    });
  }

  async deleteGame(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    await this.prisma.gameTag.deleteMany({ where: { gameId } });
    await this.prisma.game.delete({ where: { id: gameId } });

    return { deleted: true };
  }

  async scheduleRelease(dto: ScheduleReleaseDto, createdBy: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.prisma.gameRelease.create({
      data: {
        gameId: dto.gameId,
        scheduledAt: new Date(dto.scheduledAt),
        releaseType: dto.releaseType ?? 'NEW',
        announcement: dto.announcement,
        isFeatured: dto.isFeatured ?? false,
        createdBy,
      },
      include: {
        game: {
          select: {
            slug: true,
            title: true,
          },
        },
      },
    });
  }

  async listGames(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true, slug: true } },
          tags: { select: { tag: true } },
          _count: {
            select: {
              gameSessions: true,
              scores: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.game.count(),
    ]);

    return {
      data: games,
      meta: {
        total,
        page,
        perPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
