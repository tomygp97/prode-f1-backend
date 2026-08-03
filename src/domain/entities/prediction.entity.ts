export class Prediction {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly leagueId: string,
    public readonly raceId: string,
    public readonly predictedOrder: string[],
    public readonly trackedDriverPosition: number | null,
    public readonly safetyCar: boolean,
    public readonly dnfCount: number,
  ) {}

  static create(props: {
    id: string;
    userId: string;
    leagueId: string;
    raceId: string;
    predictedOrder: string[];
    trackedDriverPosition?: number | null;
    safetyCar: boolean;
    dnfCount: number;
  }): Prediction {
    if (props.predictedOrder.length < 3 || props.predictedOrder.length > 22) {
      throw new Error('Predicted order must have between 3 and 22 drivers');
    }
    const hasDuplicates = new Set(props.predictedOrder).size !== props.predictedOrder.length;
    if (hasDuplicates) {
      throw new Error('Predicted order cannot contain duplicate drivers');
    }
    if (props.dnfCount < 0) {
      throw new Error('DNF count cannot be negative');
    }
    if (props.trackedDriverPosition != null && props.trackedDriverPosition < 1) {
      throw new Error('Tracked driver position must be at least 1');
    }

    return new Prediction(
      props.id,
      props.userId,
      props.leagueId,
      props.raceId,
      props.predictedOrder,
      props.trackedDriverPosition ?? null,
      props.safetyCar,
      props.dnfCount,
    );
  }
}