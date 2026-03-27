import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { GameReleasedEvent } from '../events/game-released.event';

@Injectable()
export class ReleasesService {
  private readonly logger = new Logger(ReleasesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getUpcoming(limit = 10) {
    return this.prisma.gameRelease.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gt: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      select: {
        id: true,
        scheduledAt: true,
        releaseType: true,
        announcement: true,
        isFeatured: true,
        game: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnailUrl: true,
            description: true,
            category: {
              select: {
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  async getRecent(limit = 10) {
    return this.prisma.gameRelease.findMany({
      where: {
        status: 'RELEASED',
      },
      orderBy: { releasedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        scheduledAt: true,
        releasedAt: true,
        releaseType: true,
        announcement: true,
        isFeatured: true,
        game: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnailUrl: true,
            description: true,
            difficulty: true,
            category: {
              select: {
                name: true,
                slug: true,
                color: true,
              },
            },
          },
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledReleases(): Promise<void> {
    const now = new Date();

    const dueReleases = await this.prisma.gameRelease.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        game: true,
      },
    });

    for (const release of dueReleases) {
      try {
        await this.prisma.$transaction([
          this.prisma.gameRelease.update({
            where: { id: release.id },
            data: {
              status: 'RELEASED',
              releasedAt: now,
            },
          }),
          this.prisma.game.update({
            where: { id: release.gameId },
            data: {
              isPublished: true,
              publishedAt: release.game.publishedAt ?? now,
            },
          }),
        ]);

        this.eventEmitter.emit(
          'game.released',
          new GameReleasedEvent(release.gameId, release.id, release.releaseType),
        );

        this.logger.log(
          `Released game: ${release.game.title} (${release.releaseType})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process release ${release.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }
}
