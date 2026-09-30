import { Season } from '../../../domain/entities/season.entity';
import { Season as PrismaSeason } from '@prisma/client';

export class SeasonMapper {
  static toDomain(raw: PrismaSeason): Season {
    return Season.create({ id: raw.id, year: raw.year });
  }
}