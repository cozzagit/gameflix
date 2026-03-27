export class GameReleasedEvent {
  constructor(
    public readonly gameId: string,
    public readonly releaseId: string,
    public readonly releaseType: string,
  ) {}
}
