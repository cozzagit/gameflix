import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { ScoreSubmittedEvent } from '../events/score-submitted.event';

@Injectable()
export class ScoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async submitScore(userId: string, dto: SubmitScoreDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const score = await this.prisma.score.create({
      data: {
        userId,
        gameId: dto.gameId,
        sessionId: dto.sessionId,
        score: dto.score,
        scoreMetadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
        isDaily: dto.isDaily ?? false,
        dailyDate: dto.isDaily ? new Date() : undefined,
      },
    });

    await this.prisma.game.update({
      where: { id: dto.gameId },
      data: {
        totalPlays: { increment: 1 },
      },
    });

    this.eventEmitter.emit(
      'score.submitted',
      new ScoreSubmittedEvent(
        userId,
        dto.gameId,
        score.id,
        dto.score,
        dto.isDaily ?? false,
      ),
    );

    return score;
  }

  async getLeaderboard(gameSlug: string, query: LeaderboardQueryDto) {
    const { period = 'alltime', limit = 20 } = query;

    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const dateFilter = this.getDateFilter(period);

    const scores = await this.prisma.score.findMany({
      where: {
        gameId: game.id,
        ...(dateFilter && { createdAt: { gte: dateFilter } }),
      },
      orderBy: { score: 'desc' },
      take: limit,
      distinct: ['userId'],
      select: {
        id: true,
        score: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            currentLevel: true,
          },
        },
      },
    });

    return {
      game: {
        id: game.id,
        slug: game.slug,
        title: game.title,
        scoringType: game.scoringType,
      },
      period,
      entries: scores.map((entry, index) => ({
        rank: index + 1,
        score: entry.score,
        achievedAt: entry.createdAt,
        user: entry.user,
      })),
    };
  }

  async getUserRank(userId: string, gameId: string, period = 'alltime') {
    const dateFilter = this.getDateFilter(period);

    const userBestScore = await this.prisma.score.findFirst({
      where: {
        userId,
        gameId,
        ...(dateFilter && { createdAt: { gte: dateFilter } }),
      },
      orderBy: { score: 'desc' },
    });

    if (!userBestScore) {
      return null;
    }

    const higherScoresCount = await this.prisma.score.groupBy({
      by: ['userId'],
      where: {
        gameId,
        score: { gt: userBestScore.score },
        ...(dateFilter && { createdAt: { gte: dateFilter } }),
      },
    });

    return {
      rank: higherScoresCount.length + 1,
      score: userBestScore.score,
      achievedAt: userBestScore.createdAt,
    };
  }

  async getNearbyPlayers(userId: string, gameSlug: string, range = 5) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const userRank = await this.getUserRank(userId, game.id);
    if (!userRank) {
      return { above: [], user: null, below: [] };
    }

    const allTopScores = await this.prisma.score.findMany({
      where: { gameId: game.id },
      orderBy: { score: 'desc' },
      distinct: ['userId'],
      select: {
        score: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            currentLevel: true,
          },
        },
      },
    });

    const userIndex = allTopScores.findIndex(
      (entry) => entry.user.id === userId,
    );

    const startIndex = Math.max(0, userIndex - range);
    const endIndex = Math.min(allTopScores.length, userIndex + range + 1);

    const nearby = allTopScores.slice(startIndex, endIndex).map((entry, idx) => ({
      rank: startIndex + idx + 1,
      score: entry.score,
      user: entry.user,
      isCurrentUser: entry.user.id === userId,
    }));

    return nearby;
  }

  private getDateFilter(period: string): Date | null {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'weekly': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      }
      case 'alltime':
      default:
        return null;
    }
  }
}
