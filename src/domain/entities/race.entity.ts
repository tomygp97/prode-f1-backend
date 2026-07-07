export class Race {
    private constructor(
        public readonly id: string,
        public readonly seasonId: string,
        public readonly name: string,
        public readonly circuit: string,
        public readonly country: string,
        public readonly round: number,
        public readonly qualifyingSartAt: Date | null,
        public readonly raceStartAt: Date | null,
        public readonly status: string,
        public readonly externalId: string,
    ) {}

    static create(props: {
        id: string,
        seasonId: string,
        name: string,
        circuit: string,
        country: string,
        round: number,
        qualifyingSartAt: Date | null,
        raceStartAt: Date | null,
        status: string,
        externalId: string,
    }): Race {
        return new Race(
            props.id,
            props.seasonId,
            props.name,
            props.circuit,
            props.country,
            props.round,
            props.qualifyingSartAt,
            props.raceStartAt,
            props.status,
            props.externalId,
        );
    }

    isLocked(): boolean {
        return this.status === 'locked';
    }

    isFinished(): boolean {
        return this.status === 'finished';
    }
}