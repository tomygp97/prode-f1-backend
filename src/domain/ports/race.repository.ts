import type { RaceMeetingData } from './official-results.provider';

export interface RaceRepository {
  upsertFromMeeting(meeting: RaceMeetingData, season_id: string, round: number): Promise<void>;
  findAll(): Promise<any[]>;
  findNext(): Promise<any | null>;
}