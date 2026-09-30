export interface DriverProps {
    id: string;
    name: string;
    acronym: string;
    driverNumber: number;
    seasonId: string;
    teamId: string;
}

export class Driver {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly acronym: string,
        public readonly driverNumber: number,
        public readonly seasonId: string,
        public readonly teamId: string,
    ) {}

    static create(props: DriverProps): Driver {
        return new Driver(
            props.id,
            props.name,
            props.acronym,
            props.driverNumber,
            props.seasonId,
            props.teamId,
        );
    }
}