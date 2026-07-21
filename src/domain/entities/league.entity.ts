
export class League {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ownerId: string,
    public readonly inviteCode: string,
    public readonly isPublic: boolean,
    public readonly seasonId: string,
    public readonly trackedDriverId: string | null,
  ) {}

  static create(props: {
    id: string;
    name: string;
    ownerId: string;
    inviteCode: string;
    isPublic: boolean;
    seasonId: string;
    trackedDriverId?: string | null;
  }): League {
    return new League(
      props.id,
      props.name,
      props.ownerId,
      props.inviteCode,
      props.isPublic,
      props.seasonId,
      props.trackedDriverId ?? null,
    );
  }
}

