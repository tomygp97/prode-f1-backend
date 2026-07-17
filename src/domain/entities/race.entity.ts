import { RaceStatus } from "../enums/race-status.enum";

export class Race {
    private constructor(
        public readonly id: string,
        public readonly seasonId: string,
        public readonly name: string,
        public readonly circuit: string,
        public readonly country: string,
        public readonly round: number,
        public readonly qualifyingStartAt: Date | null,
        public readonly raceStartAt: Date | null,
        public readonly status: RaceStatus,
        public readonly meetingKey: number,
        public readonly raceSessionKey: number | null,
        public readonly qualifyingSessionKey: number | null,
    ) {}

    static create(props: {
        id: string,
        seasonId: string,
        name: string,
        circuit: string,
        country: string,
        round: number,
        qualifyingStartAt: Date | null,
        raceStartAt: Date | null,
        status: RaceStatus,
        meetingKey: number,
        raceSessionKey: number | null,
        qualifyingSessionKey: number | null,
    }): Race {
        return new Race(
            props.id,
            props.seasonId,
            props.name,
            props.circuit,
            props.country,
            props.round,
            props.qualifyingStartAt,
            props.raceStartAt,
            props.status,
            props.meetingKey,
            props.raceSessionKey,
            props.qualifyingSessionKey,
        );
    }

    isLocked(): boolean {
        return this.status === RaceStatus.LOCKED;
    }

    isFinished(): boolean {
        return this.status === RaceStatus.FINISHED;
    }
}
