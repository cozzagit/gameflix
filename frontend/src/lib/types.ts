export type Plan = 'free' | 'premium';
export type Role = 'user' | 'admin';
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type CategorySlug = 'brainlab' | 'wordforge' | 'quizarena' | 'mysterium' | 'tinkerfarm';
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: Role;
  totalXp: number;
  currentLevel: number;
  plan: Plan;
  streakDays: number;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  tagline: string;
  iconUrl: string | null;
  gameCount: number;
}

// Game as returned by the backend API
export interface GameRaw {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: number;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  scoringType: string;
  supportsDaily: boolean;
  totalPlays: number;
  totalLikes: number;
  avgRating: string;
  activePlayers: number;
  publishedAt: string | null;
  estimatedDurationMin: number | null;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  tags: { tag: string }[] | string[];
}

// Normalized Game for frontend components
export interface Game {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: CategorySlug;
  categoryName: string;
  categoryColor: string;
  difficulty: Difficulty;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  isPremium: boolean;
  isNew: boolean;
  isTrending: boolean;
  playCount: number;
  likeCount: number;
  ratingPercent: number;
  releasedAt: string;
  tags: string[];
  estimatedDuration: number | null;
  platforms: ('desktop' | 'mobile')[];
}

export interface GameDetail extends Game {
  leaderboard: LeaderboardEntry[];
  userBestScore: number | null;
  userRank: number | null;
  similarGames: Game[];
}

/** Transform backend game response to frontend Game type */
export function normalizeGame(raw: GameRaw): Game {
  const publishedAt = raw.publishedAt || '';
  const daysSinceRelease = publishedAt
    ? Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000)
    : 999;

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((t) => (typeof t === 'string' ? t : t.tag))
    : [];

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description || '',
    categorySlug: (raw.category?.slug || 'brainlab') as CategorySlug,
    categoryName: raw.category?.name || 'BrainLab',
    categoryColor: raw.category?.color || '#3B82F6',
    difficulty: (raw.difficulty || 3) as Difficulty,
    thumbnailUrl: raw.thumbnailUrl,
    bannerUrl: raw.bannerUrl,
    isPremium: false,
    isNew: daysSinceRelease <= 7,
    isTrending: raw.totalPlays > 50,
    playCount: raw.totalPlays || 0,
    likeCount: raw.totalLikes || 0,
    ratingPercent: raw.totalPlays > 0
      ? Math.round((raw.totalLikes / Math.max(raw.totalPlays, 1)) * 100)
      : 0,
    releasedAt: publishedAt,
    tags,
    estimatedDuration: raw.estimatedDurationMin,
    platforms: tags.includes('desktop-only') ? ['desktop'] : ['desktop', 'mobile'],
  };
}

export interface Score {
  id: string;
  userId: string;
  gameId: string;
  gameSlug: string;
  score: number;
  durationSeconds: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  level: number;
  streakDays: number;
  isCurrentUser: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  requiredValue: number;
}

export interface UserBadge {
  badge: Badge;
  earnedAt: string;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  lastPlayedAt: string | null;
}

export interface XpTransaction {
  id: string;
  amount: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface UserProgress {
  totalXp: number;
  currentLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpInCurrentLevel: number;
  streak: UserStreak;
  badges: UserBadge[];
  recentXp: XpTransaction[];
}

export interface GameSession {
  id: string;
  gameSlug: string;
  gameTitle: string;
  score: number;
  xpEarned: number;
  durationSeconds: number;
  completedAt: string;
}

export interface GameRelease {
  id: string;
  gameSlug: string;
  gameTitle: string;
  categorySlug: CategorySlug;
  description: string;
  thumbnailUrl: string | null;
  releaseDate: string;
  isReleased: boolean;
}

export interface DailyChallenge {
  categorySlug: CategorySlug;
  categoryName: string;
  gameSlug: string;
  gameTitle: string;
  completed: boolean;
  score: number | null;
}

export interface UserActivity {
  id: string;
  type: 'game_played' | 'badge_earned' | 'level_up' | 'streak_milestone';
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PricingPlan {
  name: string;
  slug: Plan;
  price: number;
  period: string;
  features: string[];
  highlighted: boolean;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  meta?: {
    version: string;
    requestId: string;
  };
}

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface Subscription {
  id: string;
  plan: Plan;
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
}
