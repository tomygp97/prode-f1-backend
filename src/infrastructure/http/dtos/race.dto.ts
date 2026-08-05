import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { Race } from "../../../domain/entities/race.entity";

export class RaceDto {
    id!: string;
    seasonId!: string;
    name!: string;
    circuit!: string;
    country!: string;
    round!: number;
    qualifyingStartAt!: Date | null;
    raceStartAt!: Date | null;
    status!: RaceStatus;
    meetingKey!: number;
    raceSessionKey!: number | null;
    qualifyingSessionKey!: number | null;

    static fromDomain(race: Race): RaceDto {
        return {
            id: race.id,
            seasonId: race.seasonId,
            name: race.name,
            circuit: race.circuit,
            country: race.country,
            round: race.round,
            qualifyingStartAt: race.qualifyingStartAt,
            raceStartAt: race.raceStartAt,
            status: race.status,
            meetingKey: race.meetingKey,
            raceSessionKey: race.raceSessionKey,
            qualifyingSessionKey: race.qualifyingSessionKey,
        };
    }
}