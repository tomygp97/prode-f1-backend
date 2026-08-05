export interface RaceResultProps {
    id: string;
    raceId: string;

    poleDriverId: string;
    raceWinnerDriverId: string;
    raceWinnerTeamId: string;

    safetyCar: boolean;
    dnfCount: number;

    syncedAt: Date;
}

export class RaceResult {
    private constructor(private readonly props: RaceResultProps) {}

    static create(props: RaceResultProps): RaceResult {
        return new RaceResult(props);
    }

    get id() {
        return this.props.id;
    }

    get raceId() {
        return this.props.raceId;
    }

    get poleDriverId() {
        return this.props.poleDriverId
    }
    
    get raceWinnerDriverId() {
        return this.props.raceWinnerDriverId
    }
    
    get raceWinnerTeamId() {
        return this.props.raceWinnerTeamId
    }
    
    get safetyCar() {
        return this.props.safetyCar
    }
    
    get dnfCount() {
        return this.props.dnfCount
    }
    
    get syncedAt() {
        return this.props.syncedAt
    }
}