
export class LeagueMember {
  private constructor(
    public readonly id: string,
    public readonly leagueId: string,
    public readonly userId: string,
    public readonly role: 'admin' | 'member',
    public readonly joinedAt: Date,
    public readonly leftAt: Date | null,
  ) {}

  static create(props: {
    id: string;
    leagueId: string;
    userId: string;
    role: 'admin' | 'member';
    joinedAt?: Date;
    leftAt?: Date | null;
  }): LeagueMember {
    return new LeagueMember(
      props.id,
      props.leagueId,
      props.userId,
      props.role,
      props.joinedAt ?? new Date(),
      props.leftAt ?? null,
    );
  }

  isActive(): boolean {
    return this.leftAt === null;
  }
}