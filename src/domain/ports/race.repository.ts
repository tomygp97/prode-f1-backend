import { RaceStatus } from '../enums/race-status.enum';
import type { RaceMeetingData } from './official-results.provider';

export interface RaceRepository {
  upsertFromMeeting(meeting: RaceMeetingData, season_id: string, round: number): Promise<void>;
  findAll(): Promise<any[]>;
  findNext(): Promise<any | null>;
  findScheduledBeforeDate(date: Date): Promise<any[]>;
  findLockedBeforeDate(date: Date): Promise<any[]>;
  updateStatus(raceId: string, status:RaceStatus): Promise<void>;
}