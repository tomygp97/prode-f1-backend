import { Season } from '../entities/season.entity';

export abstract class SeasonRepository {
  abstract findByYear(year: number): Promise<Season | null>;
}