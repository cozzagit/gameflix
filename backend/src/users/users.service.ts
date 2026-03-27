import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        totalXp: true,
        currentLevel: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            gameSessions: true,
            scores: true,
            likes: true,
            userBadges: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        totalXp: true,
        currentLevel: true,
        createdAt: true,
        lastLoginAt: true,
        subscription: {
          select: {
            id: true,
            status: true,
            billingPeriod: true,
            currentPeriodEnd: true,
            plan: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        userBadges: {
          select: {
            earnedAt: true,
            badge: {
              select: {
                slug: true,
                name: true,
                iconUrl: true,
                category: true,
              },
            },
          },
          orderBy: { earnedAt: 'desc' },
          take: 10,
        },
        userStreaks: {
          select: {
            streakType: true,
            currentCount: true,
            longestCount: true,
            lastActivity: true,
          },
        },
        _count: {
          select: {
            gameSessions: true,
            scores: true,
            likes: true,
            userBadges: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        totalXp: true,
        currentLevel: true,
        createdAt: true,
        userBadges: {
          select: {
            earnedAt: true,
            badge: {
              select: {
                slug: true,
                name: true,
                iconUrl: true,
                category: true,
              },
            },
          },
          orderBy: { earnedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            gameSessions: true,
            scores: true,
            userBadges: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        totalXp: true,
        currentLevel: true,
      },
    });
  }
}
