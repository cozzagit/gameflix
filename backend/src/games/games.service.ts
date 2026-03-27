import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GameQueryDto } from './dto/game-query.dto';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GameQueryDto) {
    const { page = 1, limit = 20, category, difficulty, sort = 'popular', search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GameWhereInput = {
      isPublished: true,
    };

    if (category) {
      where.category = { slug: category };
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.GameOrderByWithRelationInput;
    switch (sort) {
      case 'recent':
        orderBy = { publishedAt: 'desc' };
        break;
      case 'rating':
        orderBy = { avgRating: 'desc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'popular':
      default:
        orderBy = { totalPlays: 'desc' };
        break;
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          difficulty: true,
          thumbnailUrl: true,
          bannerUrl: true,
          scoringType: true,
          supportsDaily: true,
          totalPlays: true,
          totalLikes: true,
          avgRating: true,
          activePlayers: true,
          publishedAt: true,
          estimatedDurationMin: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true,
            },
          },
          tags: {
            select: { tag: true },
          },
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      data: games.map((game) => ({
        ...game,
        tags: game.tags.map((t) => t.tag),
      })),
      meta: {
        total,
        page,
        perPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        thumbnailUrl: true,
        bannerUrl: true,
        scoringType: true,
        supportsDaily: true,
        config: true,
        version: true,
        totalPlays: true,
        totalLikes: true,
        avgRating: true,
        activePlayers: true,
        estimatedDurationMin: true,
        publishedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          select: { tag: true },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return {
      ...game,
      tags: game.tags.map((t) => t.tag),
    };
  }

  async registerPlay(slug: string, userId: string) {
    const game = await this.prisma.game.findUnique({ where: { slug } });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Create session
    const session = await this.prisma.gameSession.create({
      data: {
        userId,
        gameId: game.id,
      },
    });

    // Increment play count
    await this.prisma.game.update({
      where: { id: game.id },
      data: { totalPlays: { increment: 1 } },
    });

    return { sessionId: session.id, gameId: game.id };
  }

  async findByCategory(categorySlug: string, page = 1, limit = 20) {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const skip = (page - 1) * limit;
    const where: Prisma.GameWhereInput = {
      isPublished: true,
      categoryId: category.id,
    };

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        orderBy: { totalPlays: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          difficulty: true,
          thumbnailUrl: true,
          scoringType: true,
          totalPlays: true,
          totalLikes: true,
          avgRating: true,
          activePlayers: true,
          tags: {
            select: { tag: true },
          },
        },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        tagline: category.tagline,
        description: category.description,
        color: category.color,
      },
      data: games.map((game) => ({
        ...game,
        tags: game.tags.map((t) => t.tag),
      })),
      meta: {
        total,
        page,
        perPage: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
