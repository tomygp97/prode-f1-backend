import { IsString, IsBoolean, IsUUID, IsOptional, MinLength } from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsBoolean()
  isPublic!: boolean;

  @IsUUID()
  seasonId!: string;

  @IsOptional()
  @IsUUID()
  trackedDriverId?: string;
}