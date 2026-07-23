// domain/entities/league.entity.ts
export class League {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly ownerId: string,
    public readonly inviteCode: string,
    public readonly isPublic: boolean,
    public readonly predictionSlots: number,
    public readonly seasonId: string,
    public readonly trackedDriverId: string | null,
  ) {}

  static create(props: {
    id: string;
    name: string;
    ownerId: string;
    inviteCode: string;
    isPublic: boolean;
    predictionSlots?: number;
    seasonId: string;
    trackedDriverId?: string | null;
  }): League {
    const predictionSlots = props.predictionSlots ?? 3;
    if (predictionSlots < 3 || predictionSlots > 22) {
      throw new Error('Prediction slots must be between 3 and 22');
    }

    return new League(
      props.id,
      props.name,
      props.ownerId,
      props.inviteCode,
      props.isPublic,
      predictionSlots,
      props.seasonId,
      props.trackedDriverId ?? null,
    );
  }
}