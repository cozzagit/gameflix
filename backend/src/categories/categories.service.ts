import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        color: true,
        iconUrl: true,
        displayOrder: true,
        _count: {
          select: {
            games: {
              where: { isPublished: true },
            },
          },
        },
      },
    });
  }
}
