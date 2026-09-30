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
        public readonly scoresCalculatedAt: Date | null,
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
        scoresCalculatedAt?: Date | null,
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
            props.scoresCalculatedAt ?? null, 
        );
    }

    isLocked(): boolean {
        return this.status === RaceStatus.LOCKED;
    }

    isFinished(): boolean {
        return this.status === RaceStatus.FINISHED;
    }

    hasScoresCalculated(): boolean {
        return this.scoresCalculatedAt !== null;
    }

    /**
     * Se puede predecir hasta que empieza la qualy. Se mira la hora además del estado:
     * el paso a LOCKED lo hace un cron (cada 2 min) y no puede quedar una ventana abierta.
     */
    arePredictionsOpen(now: Date = new Date()): boolean {
        if (this.status !== RaceStatus.SCHEDULED) return false;
        return this.qualifyingStartAt === null || this.qualifyingStartAt.getTime() > now.getTime();
    }
}
