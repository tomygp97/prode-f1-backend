import { Season } from '../entities/season.entity';

export abstract class SeasonRepository {
  abstract findByYear(year: number): Promise<Season | null>;
  /** Devuelve la season del año y la crea si no existe. */
  abstract ensureForYear(year: number): Promise<Season>;
}
