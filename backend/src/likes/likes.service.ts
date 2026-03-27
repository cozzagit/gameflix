import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleLike(userId: string, gameSlug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: game.id,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          userId_gameId: {
            userId,
            gameId: game.id,
          },
        },
      });

      await this.updateGameLikeCount(game.id);

      return { liked: false, totalLikes: game.totalLikes - 1 };
    }

    await this.prisma.like.create({
      data: {
        userId,
        gameId: game.id,
        isPositive: true,
      },
    });

    await this.updateGameLikeCount(game.id);

    return { liked: true, totalLikes: game.totalLikes + 1 };
  }

  async removeLike(userId: string, gameSlug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    await this.prisma.like.deleteMany({
      where: {
        userId,
        gameId: game.id,
      },
    });

    await this.updateGameLikeCount(game.id);

    return { liked: false };
  }

  async getUserLikeStatus(userId: string, gameSlug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug: gameSlug },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const like = await this.prisma.like.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId: game.id,
        },
      },
    });

    return {
      liked: !!like,
      isPositive: like?.isPositive ?? null,
      totalLikes: game.totalLikes,
    };
  }

  private async updateGameLikeCount(gameId: string): Promise<void> {
    const likeCount = await this.prisma.like.count({
      where: {
        gameId,
        isPositive: true,
      },
    });

    await this.prisma.game.update({
      where: { id: gameId },
      data: { totalLikes: likeCount },
    });
  }
}
