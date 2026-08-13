export class Season {
  private constructor(
    public readonly id: string,
    public readonly year: number,
  ) {}

  static create(props: { id: string; year: number }): Season {
    return new Season(props.id, props.year);
  }
}