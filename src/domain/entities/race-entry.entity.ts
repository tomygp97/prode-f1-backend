export interface RaceEntryProps {
    id: string;
    raceId: string;
    driverId: string;
    teamId: string;
}

/** Un piloto en la grilla de una carrera, con el equipo con el que corre esa carrera. */
export class RaceEntry {
    private constructor(
        public readonly id: string,
        public readonly raceId: string,
        public readonly driverId: string,
        public readonly teamId: string,
    ) {}

    static create(props: RaceEntryProps): RaceEntry {
        return new RaceEntry(props.id, props.raceId, props.driverId, props.teamId);
    }
}
