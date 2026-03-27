export class ScoreSubmittedEvent {
  constructor(
    public readonly userId: string,
    public readonly gameId: string,
    public readonly scoreId: string,
    public readonly scoreValue: number,
    public readonly isDaily: boolean,
  ) {}
}
