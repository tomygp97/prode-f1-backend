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
        );
    }

    isLocked(): boolean {
        return this.status === RaceStatus.LOCKED;
    }

    isFinished(): boolean {
        return this.status === RaceStatus.FINISHED;
    }
}
