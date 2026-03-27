export class BadgeEarnedEvent {
  constructor(
    public readonly userId: string,
    public readonly badgeId: string,
    public readonly badgeSlug: string,
    public readonly xpReward: number,
  ) {}
}
