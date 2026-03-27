'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Pause,
  Play,
  Clock,
  Trophy,
  Share2,
  Zap,
  Home,
  RotateCcw,
  Star,
  TrendingUp,
  Volume2,
  VolumeX,
  Gamepad2,
  Maximize,
  Minimize,
} from 'lucide-react';
import { cn, formatNumber, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XpPopup } from '@/components/gamification/xp-popup';
import { useAuthStore } from '@/lib/stores/auth-store';
import api from '@/lib/api';

// SDK protocol types — mirrored from games/_sdk/types.ts
// These must stay in sync with the Game SDK

interface GameflixMessage {
  type: string;
  payload: Record<string, unknown>;
}

interface GameflixInitPayload {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  config: Record<string, unknown>;
  gameId: string;
  sessionId: string;
}

interface GameflixScorePayload {
  score: number;
  metadata?: Record<string, unknown>;
  isDaily?: boolean;
}

interface GameflixCompletePayload {
  score: number;
  metadata?: Record<string, unknown>;
  levelId?: number;
  stars?: number;
  timeSeconds?: number;
}

interface GameflixEventPayload {
  event: string;
  data?: Record<string, unknown>;
}

interface GameResult {
  score: number;
  xpEarned: number;
  rank: number;
  totalPlayers: number;
  durationSeconds: number;
  isNewBest: boolean;
  stars?: number;
  levelId?: number;
}

interface ScoreSubmitResponse {
  xpEarned: number;
  rank: number;
  totalPlayers: number;
  isNewBest: boolean;
}

export default function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const user = useAuthStore((s) => s.user);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showXp, setShowXp] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isGameReady, setIsGameReady] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const playRegistered = useRef(false);

  const gameTitle = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Register play session when page loads (increments play count)
  useEffect(() => {
    if (playRegistered.current) return;
    playRegistered.current = true;
    api.post(`/games/${slug}/play`).catch(() => {});
  }, [slug]);

  // Listen for fullscreen changes (user might press Escape)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!gameAreaRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      gameAreaRef.current.requestFullscreen().catch(() => {});
    }
  }, []);

  /** Send a postMessage to the game iframe */
  const sendToGame = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type, payload }, '*');
    }
  }, []);

  /** Send GAMEFLIX_INIT to game with user data */
  const sendInitToGame = useCallback(() => {
    if (!user) return;

    const initPayload: GameflixInitPayload = {
      user: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      config: {},
      gameId: slug,
      sessionId,
    };

    sendToGame('GAMEFLIX_INIT', initPayload as unknown as Record<string, unknown>);
  }, [user, slug, sessionId, sendToGame]);

  /** Submit score to backend API */
  const submitScoreToBackend = useCallback(async (
    score: number,
    metadata?: Record<string, unknown>,
    isDaily?: boolean,
  ): Promise<ScoreSubmitResponse> => {
    try {
      const { data } = await api.post<{ data: ScoreSubmitResponse }>(`/games/${slug}/scores`, {
        score,
        durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        metadata,
        isDaily,
        sessionId,
      });
      return data.data;
    } catch {
      // Fallback response if API call fails
      return {
        xpEarned: Math.floor(score / 100) * 10,
        rank: 0,
        totalPlayers: 0,
        isNewBest: false,
      };
    }
  }, [slug, sessionId]);

  /** Handle incoming messages from game iframe */
  const handleGameMessage = useCallback(async (event: MessageEvent) => {
    const msg = event.data as GameflixMessage;
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'GAMEFLIX_READY': {
        setIsGameReady(true);
        sendInitToGame();
        break;
      }

      case 'GAMEFLIX_SCORE': {
        const scorePayload = msg.payload as unknown as GameflixScorePayload;
        await submitScoreToBackend(
          scorePayload.score,
          scorePayload.metadata,
          scorePayload.isDaily,
        );
        break;
      }

      case 'GAMEFLIX_COMPLETE': {
        const completePayload = msg.payload as unknown as GameflixCompletePayload;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

        const backendResult = await submitScoreToBackend(
          completePayload.score,
          completePayload.metadata,
        );

        const result: GameResult = {
          score: completePayload.score,
          xpEarned: backendResult.xpEarned,
          rank: backendResult.rank,
          totalPlayers: backendResult.totalPlayers,
          durationSeconds: completePayload.timeSeconds ?? duration,
          isNewBest: backendResult.isNewBest,
          stars: completePayload.stars,
          levelId: completePayload.levelId,
        };

        setGameResult(result);
        setShowXp(true);
        break;
      }

      case 'GAMEFLIX_EVENT': {
        const eventPayload = msg.payload as unknown as GameflixEventPayload;
        // Fire and forget analytics event to backend
        api.post(`/games/${slug}/events`, {
          event: eventPayload.event,
          data: eventPayload.data,
          sessionId,
        }).catch(() => {
          // Silently ignore analytics failures
        });
        break;
      }

      // Legacy support: handle old GAME_COMPLETE format
      case 'GAME_COMPLETE' as string: {
        const legacyData = msg.payload ?? event.data;
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const score = (legacyData as Record<string, unknown>).score as number ?? 0;

        const backendResult = await submitScoreToBackend(score);

        const result: GameResult = {
          score,
          xpEarned: backendResult.xpEarned,
          rank: backendResult.rank,
          totalPlayers: backendResult.totalPlayers,
          durationSeconds: duration,
          isNewBest: backendResult.isNewBest,
        };

        setGameResult(result);
        setShowXp(true);
        break;
      }
    }
  }, [sendInitToGame, submitScoreToBackend, slug, sessionId]);

  /** Register message listener */
  useEffect(() => {
    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [handleGameMessage]);

  /** Timer that tracks elapsed play time */
  useEffect(() => {
    if (!isPaused && !gameResult) {
      const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused, gameResult]);

  /** Reset start time reference when game restarts */
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  /** Toggle pause and notify the game */
  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      sendToGame(next ? 'GAMEFLIX_PAUSE' : 'GAMEFLIX_RESUME');
      return next;
    });
  }, [sendToGame]);

  /** Restart the game: reset state and reload iframe */
  const restartGame = useCallback(() => {
    setGameResult(null);
    setElapsed(0);
    setIsGameReady(false);
    startTimeRef.current = Date.now();
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  }, []);

  /** Exit game: notify iframe before leaving */
  const handleExit = useCallback(() => {
    sendToGame('GAMEFLIX_EXIT');
  }, [sendToGame]);

  /** Share result */
  const handleShare = useCallback(() => {
    if (!gameResult) return;
    const shareText = `Ho fatto ${formatNumber(gameResult.score)} punti in ${gameTitle} su Gameflix!`;
    if (navigator.share) {
      navigator.share({
        title: `Gameflix - ${gameTitle}`,
        text: shareText,
      }).catch(() => {
        // User cancelled share
      });
    } else {
      navigator.clipboard.writeText(shareText).catch(() => {
        // Clipboard unavailable
      });
    }
  }, [gameResult, gameTitle]);

  /** Render star rating if stars are present */
  const renderStars = (count: number) => {
    return (
      <div className="flex items-center justify-center gap-0.5">
        {Array.from({ length: 3 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'w-6 h-6',
              i < count
                ? 'text-gameflix-accent fill-gameflix-accent'
                : 'text-gameflix-text-dim/30',
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gameflix-surface border-b border-gameflix-border">
        <div className="flex items-center gap-3">
          <Link
            href={`/games/${slug}`}
            onClick={handleExit}
            className="p-2 rounded-lg text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-card transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-sm font-bold text-gameflix-text-bright">{gameTitle}</h1>
          {!isGameReady && (
            <span className="text-xs text-gameflix-text-dim">Caricamento in corso...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-gameflix-text-dim mr-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono tabular-nums">{formatDuration(elapsed)}</span>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-card transition-colors cursor-pointer"
            title={isMuted ? 'Attiva audio' : 'Disattiva audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={togglePause}
            className="p-2 rounded-lg text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-card transition-colors cursor-pointer"
            title={isPaused ? 'Riprendi' : 'Pausa'}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-gameflix-text-dim hover:text-gameflix-text hover:bg-gameflix-card transition-colors cursor-pointer"
            title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Game area */}
      <div ref={gameAreaRef} className="flex-1 relative bg-gameflix-bg">
        {/* Fullscreen exit button — only visible in fullscreen mode */}
        {isFullscreen && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all cursor-pointer group"
            title="Esci da schermo intero"
          >
            <Minimize className="w-4 h-4" />
            <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Esci</span>
          </button>
        )}

        <iframe
          ref={iframeRef}
          src={`/games/${slug}/index.html`}
          className="w-full h-full border-none"
          title={gameTitle}
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => {
            // Fallback: if the game doesn't send GAMEFLIX_READY, mark as ready after iframe loads
            setTimeout(() => setIsGameReady(true), 600);
          }}
        />

        {/* Loading overlay */}
        {!isGameReady && (
          <div className="absolute inset-0 bg-gameflix-bg flex flex-col items-center justify-center z-20">
            {/* Animated logo/spinner */}
            <div className="relative mb-8">
              {/* Outer ring */}
              <div className="w-24 h-24 rounded-full border-2 border-gameflix-border animate-[spin_3s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gameflix-primary shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
              </div>
              {/* Inner ring */}
              <div className="absolute inset-3 rounded-full border-2 border-gameflix-border/50 animate-[spin_2s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-gameflix-secondary shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
              </div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-gameflix-text-dim animate-pulse" />
              </div>
            </div>

            {/* Game title */}
            <h2 className="text-2xl font-bold text-gameflix-text-bright mb-2">{gameTitle}</h2>

            {/* Loading text with dots animation */}
            <p className="text-gameflix-text-dim text-sm flex items-center gap-1">
              Preparazione del gioco
              <span className="inline-flex w-8">
                <span className="animate-[bounce_1s_infinite_0ms] inline-block">.</span>
                <span className="animate-[bounce_1s_infinite_200ms] inline-block">.</span>
                <span className="animate-[bounce_1s_infinite_400ms] inline-block">.</span>
              </span>
            </p>

            {/* Subtle progress bar */}
            <div className="mt-6 w-48 h-1 bg-gameflix-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gameflix-primary to-gameflix-secondary rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {isPaused && !gameResult && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10">
            <Card padding="lg" className="text-center max-w-sm">
              <Pause className="w-12 h-12 text-gameflix-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gameflix-text-bright mb-2">Gioco in pausa</h2>
              <p className="text-sm text-gameflix-text-dim mb-6">
                Prenditi un momento. Il gioco ti aspetta.
              </p>
              <div className="space-y-3">
                <Button fullWidth onClick={togglePause}>
                  <Play className="w-4 h-4" />
                  Riprendi
                </Button>
                <Link href={`/games/${slug}`} onClick={handleExit}>
                  <Button variant="ghost" fullWidth>
                    <ArrowLeft className="w-4 h-4" />
                    Esci dal gioco
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Post-game results overlay */}
        {gameResult && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10">
            <Card padding="lg" className="text-center max-w-md w-full mx-4 animate-slide-up">
              <div className="mb-6">
                <Trophy className="w-16 h-16 text-gameflix-accent mx-auto mb-4" />

                {gameResult.isNewBest && (
                  <span className="inline-block bg-gameflix-accent/20 text-gameflix-accent text-xs font-bold px-3 py-1 rounded-full mb-2">
                    NUOVO RECORD PERSONALE!
                  </span>
                )}

                <h2 className="text-2xl font-bold text-gameflix-text-bright mb-1">Partita completata!</h2>
                <p className="text-gameflix-text-dim">Ottimo lavoro!</p>

                {/* Star rating */}
                {gameResult.stars !== undefined && gameResult.stars > 0 && (
                  <div className="mt-3">
                    {renderStars(gameResult.stars)}
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gameflix-surface rounded-xl p-3">
                  <p className="text-2xl font-bold text-gameflix-text-bright">
                    {formatNumber(gameResult.score)}
                  </p>
                  <p className="text-[10px] text-gameflix-text-dim uppercase tracking-wider">Punti</p>
                </div>
                <div className="bg-gameflix-surface rounded-xl p-3">
                  <p className="text-2xl font-bold text-gameflix-secondary flex items-center justify-center gap-1">
                    <Zap className="w-5 h-5" />
                    {gameResult.xpEarned}
                  </p>
                  <p className="text-[10px] text-gameflix-text-dim uppercase tracking-wider">XP</p>
                </div>
                <div className="bg-gameflix-surface rounded-xl p-3">
                  {gameResult.rank > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-gameflix-text-bright">
                        #{gameResult.rank}
                      </p>
                      <p className="text-[10px] text-gameflix-text-dim uppercase tracking-wider">
                        su {formatNumber(gameResult.totalPlayers)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gameflix-text-dim">
                        <TrendingUp className="w-6 h-6 mx-auto" />
                      </p>
                      <p className="text-[10px] text-gameflix-text-dim uppercase tracking-wider">
                        Classifica
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Duration and level info */}
              <div className="flex items-center justify-center gap-4 text-sm text-gameflix-text-dim mb-6">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(gameResult.durationSeconds)}
                </span>
                {gameResult.levelId !== undefined && (
                  <span className="flex items-center gap-1">
                    Livello {gameResult.levelId}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button fullWidth onClick={restartGame}>
                  <RotateCcw className="w-4 h-4" />
                  Gioca ancora
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                    Condividi
                  </Button>
                  <Link href="/" className="flex-1">
                    <Button variant="ghost" fullWidth>
                      <Home className="w-4 h-4" />
                      Home
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <XpPopup amount={gameResult?.xpEarned || 0} show={showXp} onDone={() => setShowXp(false)} />
    </div>
  );
}
