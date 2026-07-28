import { IsString, IsBoolean, IsUUID, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';

export class CreateLeagueDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsBoolean()
  isPublic!: boolean;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(22)
  predictionSlots?: number;  // 👈 nuevo, opcional (si no viene, la entidad usa el default 3)

  @IsUUID()
  seasonId!: string;

  @IsOptional()
  @IsUUID()
  trackedDriverId?: string;
}