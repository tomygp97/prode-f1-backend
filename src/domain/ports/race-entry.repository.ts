import { RaceEntry } from '../entities/race-entry.entity';
import { RaceGridEntryView } from '../views/race-grid.view';

export interface RaceEntryData {
  driverId: string;
  teamId: string;
}

export abstract class RaceEntryRepository {
  /** Reemplaza la grilla completa de la carrera. */
  abstract replaceForRace(raceId: string, entries: RaceEntryData[]): Promise<void>;
  abstract findByRaceId(raceId: string): Promise<RaceEntry[]>;
  abstract findGridByRaceId(raceId: string): Promise<RaceGridEntryView[]>;
  /** Grilla de la carrera más reciente (por fecha) que ya tiene grilla en la temporada. */
  abstract findLatestGrid(seasonId: string): Promise<RaceGridEntryView[]>;
}
