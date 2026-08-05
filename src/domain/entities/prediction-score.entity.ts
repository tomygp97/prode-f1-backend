export interface PredictionScoreBreakdown {
  positions: number;      
  safetyCar: number;
  dnfCount: number;
  trackedDriver: number;
}

export class PredictionScore {
  private constructor(
    public readonly id: string,
    public readonly predictionId: string,
    public readonly pointsBreakdown: PredictionScoreBreakdown,
    public readonly totalPoints: number,
    public readonly calculatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    predictionId: string;
    pointsBreakdown: PredictionScoreBreakdown;
    calculatedAt?: Date;
  }): PredictionScore {
    const totalPoints =
      props.pointsBreakdown.positions +
      props.pointsBreakdown.safetyCar +
      props.pointsBreakdown.dnfCount +
      props.pointsBreakdown.trackedDriver;

    if (totalPoints < 0) {
      throw new Error('Total points cannot be negative');
    }

    return new PredictionScore(
      props.id,
      props.predictionId,
      props.pointsBreakdown,
      totalPoints,
      props.calculatedAt ?? new Date(),
    );
  }
}