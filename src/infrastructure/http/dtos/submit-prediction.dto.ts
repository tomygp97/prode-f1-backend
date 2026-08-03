import { IsArray, ArrayMinSize, ArrayMaxSize, IsUUID, IsBoolean, IsInt, Min, IsOptional } from 'class-validator';

export class SubmitPredictionDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(22)
  @IsUUID('4', { each: true })
  predictedOrder: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  trackedDriverPosition?: number;

  @IsBoolean()
  safetyCar: boolean;

  @IsInt()
  @Min(0)
  dnfCount: number;
}