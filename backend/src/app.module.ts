import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { CategoriesModule } from './categories/categories.module';
import { ScoresModule } from './scores/scores.module';
import { GamificationModule } from './gamification/gamification.module';
import { LikesModule } from './likes/likes.module';
import { ReleasesModule } from './releases/releases.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    CategoriesModule,
    ScoresModule,
    GamificationModule,
    LikesModule,
    ReleasesModule,
    AdminModule,
  ],
})
export class AppModule {}
