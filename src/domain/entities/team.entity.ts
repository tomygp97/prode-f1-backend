export interface TeamProps {
    id: string;
    name: string;
    colour: string;
    seasonId: string;
}

export class Team {
    private constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly colour: string,
        public readonly seasonId: string,
    ) {}

    static create(props: TeamProps): Team {
        return new Team(
            props.id,
            props.name,
            props.colour,
            props.seasonId,
        )
    }
}

