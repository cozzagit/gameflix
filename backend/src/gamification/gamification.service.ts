import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { XpSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreSubmittedEvent } from '../events/score-submitted.event';
import { BadgeEarnedEvent } from '../events/badge-earned.event';
import {
  XP_VALUES,
  getLevelForXp,
  getTitleForLevel,
  getXpForNextLevel,
  LEVEL_THRESHOLDS,
} from './xp.constants';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        totalXp: true,
        currentLevel: true,
        userBadges: {
          select: {
            earnedAt: true,
            badge: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                iconUrl: true,
                category: true,
                xpReward: true,
              },
            },
          },
          orderBy: { earnedAt: 'desc' },
        },
        userStreaks: {
          select: {
            streakType: true,
            currentCount: true,
            longestCount: true,
            lastActivity: true,
          },
        },
        xpTransactions: {
          select: {
            amount: true,
            source: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return null;
    }

    const title = getTitleForLevel(user.currentLevel);
    const xpForNextLevel = getXpForNextLevel(user.currentLevel);
    const currentLevelThreshold =
      user.currentLevel > 0 && user.currentLevel <= LEVEL_THRESHOLDS.length
        ? LEVEL_THRESHOLDS[user.currentLevel - 1]
        : 0;

    let progressPercent = 100;
    if (xpForNextLevel !== null) {
      const xpInCurrentLevel = user.totalXp - currentLevelThreshold;
      const xpNeeded = xpForNextLevel - currentLevelThreshold;
      progressPercent = Math.min(
        100,
        Math.floor((xpInCurrentLevel / xpNeeded) * 100),
      );
    }

    return {
      totalXp: user.totalXp,
      currentLevel: user.currentLevel,
      title,
      xpForNextLevel,
      progressPercent,
      badges: user.userBadges.map((ub) => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
      })),
      streaks: user.userStreaks,
      recentXp: user.xpTransactions,
    };
  }

  async addXp(
    userId: string,
    amount: number,
    source: XpSource,
    sourceId?: string,
  ): Promise<void> {
    await this.prisma.xpTransaction.create({
      data: {
        userId,
        amount,
        source,
        sourceId,
      },
    });

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: amount },
      },
    });

    const newLevel = getLevelForXp(user.totalXp);
    if (newLevel !== user.currentLevel) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { currentLevel: newLevel },
      });
      this.logger.log(
        `User ${userId} leveled up from ${user.currentLevel} to ${newLevel}`,
      );
    }
  }

  async updateStreak(userId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await this.prisma.userStreak.upsert({
      where: {
        userId_streakType: {
          userId,
          streakType: 'DAILY_PLAY',
        },
      },
      create: {
        userId,
        streakType: 'DAILY_PLAY',
        currentCount: 1,
        longestCount: 1,
        lastActivity: today,
      },
      update: {},
    });

    if (streak.lastActivity) {
      const lastDate = new Date(streak.lastActivity);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        return;
      }

      if (diffDays === 1) {
        const newCount = streak.currentCount + 1;
        const newLongest = Math.max(newCount, streak.longestCount);

        await this.prisma.userStreak.update({
          where: { id: streak.id },
          data: {
            currentCount: newCount,
            longestCount: newLongest,
            lastActivity: today,
          },
        });

        await this.addXp(userId, XP_VALUES.STREAK_DAY, 'STREAK');

        if (newCount % 7 === 0) {
          await this.addXp(userId, XP_VALUES.STREAK_MILESTONE, 'STREAK');
        }
      } else {
        await this.prisma.userStreak.update({
          where: { id: streak.id },
          data: {
            currentCount: 1,
            lastActivity: today,
          },
        });
      }
    } else {
      await this.prisma.userStreak.update({
        where: { id: streak.id },
        data: {
          currentCount: 1,
          longestCount: Math.max(1, streak.longestCount),
          lastActivity: today,
        },
      });
    }
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBadges: { select: { badgeId: true } },
        _count: {
          select: {
            gameSessions: true,
            scores: true,
            likes: true,
          },
        },
        userStreaks: true,
      },
    });

    if (!user) return;

    const earnedBadgeIds = new Set(user.userBadges.map((ub) => ub.badgeId));

    const allBadges = await this.prisma.badge.findMany({
      where: { isActive: true },
    });

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const condition = badge.condition as Record<string, number> | null;
      if (!condition) continue;

      let earned = false;

      if (condition.minGamesPlayed && user._count.gameSessions >= condition.minGamesPlayed) {
        earned = true;
      }
      if (condition.minScores && user._count.scores >= condition.minScores) {
        earned = true;
      }
      if (condition.minLevel && user.currentLevel >= condition.minLevel) {
        earned = true;
      }
      if (condition.minXp && user.totalXp >= condition.minXp) {
        earned = true;
      }
      if (condition.minStreak) {
        const dailyStreak = user.userStreaks.find(
          (s) => s.streakType === 'DAILY_PLAY',
        );
        if (dailyStreak && dailyStreak.currentCount >= condition.minStreak) {
          earned = true;
        }
      }
      if (condition.minLikes && user._count.likes >= condition.minLikes) {
        earned = true;
      }

      if (earned) {
        await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });

        if (badge.xpReward > 0) {
          await this.addXp(userId, badge.xpReward, 'BADGE', badge.id);
        }

        this.eventEmitter.emit(
          'badge.earned',
          new BadgeEarnedEvent(userId, badge.id, badge.slug, badge.xpReward),
        );

        this.logger.log(`User ${userId} earned badge: ${badge.slug}`);
      }
    }
  }

  @OnEvent('score.submitted')
  async handleScoreSubmitted(event: ScoreSubmittedEvent): Promise<void> {
    const xpAmount = event.isDaily
      ? XP_VALUES.DAILY_COMPLETE
      : XP_VALUES.GAME_COMPLETE;

    await this.addXp(event.userId, xpAmount, 'GAME_COMPLETE', event.scoreId);
    await this.updateStreak(event.userId);
    await this.checkAndAwardBadges(event.userId);
  }
}
