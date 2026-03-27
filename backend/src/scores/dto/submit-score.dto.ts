import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  IsObject,
} from 'class-validator';

export class SubmitScoreDto {
  @IsString()
  gameId!: string;

  @IsInt()
  @Min(0)
  score!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isDaily?: boolean;

  @IsOptional()
  @IsString()
  sessionId?: string;
}
