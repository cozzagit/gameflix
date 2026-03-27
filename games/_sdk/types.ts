/**
 * Gameflix Game SDK — Standard interface for all games
 *
 * Every game integrated into Gameflix communicates with the platform
 * through the GameflixSDK object injected via window.postMessage.
 */

export interface GameflixMessage {
  type: GameflixMessageType;
  payload: Record<string, unknown>;
}

export type GameflixMessageType =
  | 'GAMEFLIX_INIT'        // Platform → Game: initialize with user data
  | 'GAMEFLIX_READY'       // Game → Platform: game is loaded and ready
  | 'GAMEFLIX_SCORE'       // Game → Platform: submit a score
  | 'GAMEFLIX_COMPLETE'    // Game → Platform: game/level completed
  | 'GAMEFLIX_EVENT'       // Game → Platform: track custom event
  | 'GAMEFLIX_PAUSE'       // Platform → Game: pause the game
  | 'GAMEFLIX_RESUME'      // Platform → Game: resume the game
  | 'GAMEFLIX_EXIT'        // Platform → Game: user wants to exit
  ;

export interface GameflixInitPayload {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  config: Record<string, unknown>;
  gameId: string;
  sessionId: string;
}

export interface GameflixScorePayload {
  score: number;
  metadata?: Record<string, unknown>;
  isDaily?: boolean;
}

export interface GameflixCompletePayload {
  score: number;
  metadata?: Record<string, unknown>;
  levelId?: number;
  stars?: number;
  timeSeconds?: number;
}

export interface GameflixEventPayload {
  event: string;
  data?: Record<string, unknown>;
}
