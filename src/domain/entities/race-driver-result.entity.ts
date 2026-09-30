export interface RaceDriverResultProps {
    id: string;
    raceId: string;
    driverId: string;
    teamId: string;
    position: number | null;
    dnf: boolean;
}

export class RaceDriverResult {
    private constructor(
        private readonly props: RaceDriverResultProps
    ) {}

    static create(props: RaceDriverResultProps): RaceDriverResult {
        return new RaceDriverResult(props)
    }

    get id() {
        return this.props.id
    }

    get raceId() {
        return this.props.raceId
    }

    get driverId() {
        return this.props.driverId
    }

    get position(): number | null {
        return this.props.position
    }

    get teamId() {
        return this.props.teamId
    }

    get dnf() {
        return this.props.dnf
    }
}