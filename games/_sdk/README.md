# Gameflix Game SDK

Standard interface for integrating games into the Gameflix platform.

## Quick Start

```typescript
import { GameflixClient } from './_sdk/client';

const gf = new GameflixClient();

// Listen for initialization from platform
gf.onInit((data) => {
  console.log('Player:', data.user.displayName);
  // Start your game here
});

// Submit a score
gf.submitScore(1500, { level: 5, moves: 12 });

// Complete the game
gf.completeGame(1500, { level: 5, stars: 3 });

// Handle pause/resume
gf.onPause(() => game.pause());
gf.onResume(() => game.resume());
```

## Game Manifest

Every game needs a `gameflix.manifest.json`:

```json
{
  "id": "my-game",
  "version": "1.0.0",
  "title": "My Game",
  "description": "A cool game",
  "category": "brainlab",
  "difficulty": 3,
  "estimatedDuration": 10,
  "tags": ["puzzle", "logic"],
  "supportsDaily": false,
  "scoringType": "points"
}
```

## Message Protocol

Games communicate with the platform via `window.postMessage`:

| Direction | Message | Description |
|-----------|---------|-------------|
| Platform → Game | `GAMEFLIX_INIT` | User data and config |
| Game → Platform | `GAMEFLIX_READY` | Game is loaded |
| Game → Platform | `GAMEFLIX_SCORE` | Submit score |
| Game → Platform | `GAMEFLIX_COMPLETE` | Game/level complete |
| Game → Platform | `GAMEFLIX_EVENT` | Custom analytics event |
| Platform → Game | `GAMEFLIX_PAUSE` | Pause request |
| Platform → Game | `GAMEFLIX_RESUME` | Resume request |
| Platform → Game | `GAMEFLIX_EXIT` | Exit request |
