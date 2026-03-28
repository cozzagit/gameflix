import { SonarWave, CaveWall, RevealedWall, WAVE_SPEED, WAVE_MAX_RADIUS, REVEAL_DURATION } from './types';
import { playEchoReturn, playWaterEcho } from './audio';

/** Check if expanding circle at radius r intersects line segment */
function circleIntersectsSegment(
  cx: number, cy: number, r: number,
  x1: number, y1: number, x2: number, y2: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;

  const a = dx * dx + dy * dy;
  if (a < 0.001) {
    // Degenerate segment (point)
    const dist = Math.sqrt(fx * fx + fy * fy);
    return Math.abs(dist - r) < 5;
  }

  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;

  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) ||
         (t1 < 0 && t2 > 1); // segment fully inside circle
}

/** Find the closest point on segment to circle center, return distance */
function distToSegment(
  cx: number, cy: number,
  x1: number, y1: number, x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.001) return Math.sqrt((cx - x1) ** 2 + (cy - y1) ** 2);

  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
}

export class SonarSystem {
  waves: SonarWave[] = [];
  revealedWalls: Map<CaveWall, RevealedWall> = new Map();
  private hitThisWave: Map<SonarWave, Set<CaveWall>> = new Map();

  emitWave(cx: number, cy: number, time: number): void {
    const wave: SonarWave = {
      cx, cy,
      radius: 0,
      maxRadius: WAVE_MAX_RADIUS,
      birthTime: time,
      alive: true,
    };
    this.waves.push(wave);
    this.hitThisWave.set(wave, new Set());
  }

  update(dt: number, time: number, walls: CaveWall[]): void {
    // Expand waves
    for (const wave of this.waves) {
      if (!wave.alive) continue;
      const prevRadius = wave.radius;
      wave.radius += WAVE_SPEED * dt;

      if (wave.radius > wave.maxRadius) {
        wave.alive = false;
        this.hitThisWave.delete(wave);
        continue;
      }

      const hitSet = this.hitThisWave.get(wave)!;

      // Check intersections with walls
      for (const wall of walls) {
        if (hitSet.has(wall)) continue;

        const dist = distToSegment(wave.cx, wave.cy, wall.x1, wall.y1, wall.x2, wall.y2);

        // Check if wave front just passed this wall
        if (prevRadius < dist && wave.radius >= dist - 3) {
          hitSet.add(wall);

          // Reveal the wall
          this.revealedWalls.set(wall, {
            wall,
            brightness: 1.0,
            revealTime: time,
          });

          // Play echo sound based on wall type
          const echoDelay = dist / (WAVE_SPEED * 4);
          if (wall.type === 'water') {
            playWaterEcho(echoDelay);
          } else {
            playEchoReturn(echoDelay);
          }
        }
      }
    }

    // Clean up dead waves
    this.waves = this.waves.filter(w => w.alive);

    // Fade revealed walls
    for (const [key, rw] of this.revealedWalls) {
      const elapsed = time - rw.revealTime;
      if (elapsed > REVEAL_DURATION) {
        this.revealedWalls.delete(key);
      } else {
        // Brightness fades: stays at 1.0 for first 0.5s, then fades
        if (elapsed < 0.5) {
          rw.brightness = 1.0;
        } else {
          rw.brightness = 1.0 - (elapsed - 0.5) / (REVEAL_DURATION - 0.5);
        }
      }
    }
  }

  reset(): void {
    this.waves = [];
    this.revealedWalls.clear();
    this.hitThisWave.clear();
  }
}
