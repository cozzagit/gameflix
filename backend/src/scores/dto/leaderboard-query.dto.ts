import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class LeaderboardQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'alltime'])
  period?: string = 'alltime';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
