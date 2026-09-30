import { IsInt, IsString, Min, MinLength, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class PrizeItemDto {
  @IsInt()
  @Min(1)
  position!: number;

  @IsString()
  @MinLength(1)
  description!: string;
}

export class SetLeaguePrizesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrizeItemDto)
  prizes!   : PrizeItemDto[];
}