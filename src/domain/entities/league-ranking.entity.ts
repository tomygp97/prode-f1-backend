export class LeagueRanking {
  private constructor(
    public readonly id: string,
    public readonly leagueId: string,
    public readonly userId: string,
    public readonly totalPoints: number,
    public readonly racesCounted: number,
  ) {}

  static create(props: {
    id: string;
    leagueId: string;
    userId: string;
    totalPoints?: number;
    racesCounted?: number;
  }): LeagueRanking {
    const totalPoints = props.totalPoints ?? 0;
    const racesCounted = props.racesCounted ?? 0;

    if (totalPoints < 0) {
      throw new Error('Total points cannot be negative');
    }
    if (racesCounted < 0) {
      throw new Error('Races counted cannot be negative');
    }

    return new LeagueRanking(props.id, props.leagueId, props.userId, totalPoints, racesCounted);
  }

  addPoints(points: number): LeagueRanking {
    if (points < 0) {
      throw new Error('Points to add cannot be negative');
    }
    return LeagueRanking.create({
      id: this.id,
      leagueId: this.leagueId,
      userId: this.userId,
      totalPoints: this.totalPoints + points,
      racesCounted: this.racesCounted + 1,
    });
  }
}