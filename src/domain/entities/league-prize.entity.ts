
export class LeaguePrize {
  private constructor(
    public readonly id: string,
    public readonly leagueId: string,
    public readonly position: number,
    public readonly description: string,
  ) {}

  static create(props: {
    id: string;
    leagueId: string;
    position: number;
    description: string;
  }): LeaguePrize {
    if (props.position < 1) {
      throw new Error('Position must be 1 or greater');
    }
    return new LeaguePrize(props.id, props.leagueId, props.position, props.description);
  }
}