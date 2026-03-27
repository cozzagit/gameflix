// ============================================================
// TinyEmpire — Generic Object Pool
// ============================================================

/**
 * Reusable object pool that avoids GC pressure for frequently created and
 * destroyed objects such as particles and projectiles.
 *
 * Usage:
 *   const pool = new ObjectPool<Particle>(
 *     () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0,
 *               color: '#fff', size: 1, active: false }),
 *     (p) => { p.active = false; },
 *     64,
 *   );
 *
 *   const p = pool.get();   // acquire
 *   // configure p …
 *   pool.release(p);        // return when done
 */
export class ObjectPool<T> {
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;

  /** Objects that are currently alive / in use. */
  private readonly active: Set<T> = new Set();

  /** Objects that have been released and are available for reuse. */
  private readonly inactive: T[] = [];

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number) {
    this.factory = factory;
    this.reset = reset;

    // Pre-allocate the initial pool.
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      this.reset(obj);
      this.inactive.push(obj);
    }
  }

  /**
   * Acquire an object from the pool.
   * If the inactive list is empty a new object is created on-the-fly
   * (the pool grows automatically — there is no hard cap).
   */
  get(): T {
    const obj = this.inactive.length > 0
      ? this.inactive.pop()!
      : this.factory();
    this.active.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool.
   * The reset function is called immediately so the object is left in a
   * clean state for the next caller.
   */
  release(obj: T): void {
    if (!this.active.has(obj)) return; // Guard against double-release.
    this.active.delete(obj);
    this.reset(obj);
    this.inactive.push(obj);
  }

  /**
   * Iterate over all currently active objects.
   * The callback may call `release(obj)` safely — iteration uses a
   * snapshot so mutation during iteration does not cause issues.
   */
  forEach(fn: (obj: T) => void): void {
    // Copy to array first so that releases inside fn don't break iteration.
    for (const obj of Array.from(this.active)) {
      fn(obj);
    }
  }

  /** Number of active (in-use) objects. */
  get activeCount(): number {
    return this.active.size;
  }

  /** Number of pooled (available) objects. */
  get inactiveCount(): number {
    return this.inactive.length;
  }

  /** Total objects ever created by this pool. */
  get totalCount(): number {
    return this.active.size + this.inactive.length;
  }
}
