import { IsInt, Min, Max } from 'class-validator';

export class SetLeaguePredictionSlotsDto {
  @IsInt()
  @Min(3)
  @Max(22)
  predictionSlots!: number;
}