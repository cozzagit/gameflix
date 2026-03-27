import { GameState, PlacedElement, DiscoveryLogEntry } from './types';
import { ELEMENTS, BASE_ELEMENTS, getElement, getElementCount } from './elements';
import { findRecipe } from './recipes';
import {
  render,
  getWorkspaceElementAt,
  getPlacedElementAt,
  isInCombineArea,
  W, H, PANEL_W, ORB_RADIUS, WORKSPACE_Y, COMBINE_AREA_X, COMBINE_AREA_W,
  CHAPTERS, getChapterForDiscoveryCount,
} from './renderer';
import {
  createMergeParticles,
  createDiscoveryBurst,
  createInvalidPuff,
  updateParticles,
  updateSparkles,
  createSparkle,
} from './effects';
import {
  resumeAudio,
  playCombineWhoosh,
  playDiscoveryChime,
  playInvalidThud,
  playChapterFanfare,
  playPickup,
  playDrop,
  playClick,
} from './audio';
import { TITLE_FADE_SPEED, CHAPTER_COMPLETE_DURATION } from './screens';

const STORAGE_KEY = 'alchimia-save';

interface SaveData {
  discovered: string[];
  score: number;
  chapterCompleted: boolean[];
  tutorialPlayed?: boolean;
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.discovered)) return data as SaveData;
  } catch {
    // ignore
  }
  return null;
}

function saveToDisk(state: GameState): void {
  const data: SaveData = {
    discovered: Array.from(state.discovered),
    score: state.score,
    chapterCompleted: state.chapterCompleted,
    tutorialPlayed: state.showTutorialHasPlayed,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function createGame(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')!;
  canvas.width = W;
  canvas.height = H;

  // Scale canvas to fit viewport, filling width on portrait mobile
  function resizeCanvas(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isPortrait = vh > vw;
    let scale: number;
    if (isPortrait) {
      scale = vw / W;
    } else {
      scale = Math.min(vw / W, vh / H);
    }
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(vw - W * scale) / 2}px`;
    canvas.style.top = `${Math.max(0, (vh - H * scale) / 2)}px`;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Initialize state
  const state: GameState = {
    screen: 'title',
    discovered: new Set(BASE_ELEMENTS),
    score: 0,
    currentChapter: 0,
    chapterCompleted: [false, false, false, false],
    placedElements: [],
    particles: [],
    sparkles: [],
    heldElement: null,
    mouseX: W / 2,
    mouseY: H / 2,
    mouseDown: false,
    scrollOffset: 0,
    maxScroll: 0,
    discoveryAnim: null,
    invalidAnim: null,
    mergeAnim: null,
    titleAlpha: 0,
    titlePhase: 0,
    hintText: '',
    hintTimer: 0,
    hoveredElement: null,
    hoveredWorkspace: null,
    celebrationTimer: 0,
    discoveryLog: [],
    tutorialStep: 0,
    tutorialTimer: 0,
    showTutorialHasPlayed: false,
  };

  // Load save
  const save = loadSave();
  if (save) {
    state.discovered = new Set(save.discovered.filter(id => ELEMENTS[id]));
    // Ensure base elements
    for (const b of BASE_ELEMENTS) state.discovered.add(b);
    state.score = save.score || 0;
    if (save.chapterCompleted) state.chapterCompleted = save.chapterCompleted;
    state.currentChapter = getChapterForDiscoveryCount(state.discovered.size);
    state.showTutorialHasPlayed = save.tutorialPlayed || false;
  }

  // Init sparkles
  for (let i = 0; i < 30; i++) {
    state.sparkles.push(createSparkle(W, H));
  }

  // Mouse coordinate transform
  function getCanvasCoords(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // Dragging state
  let isDraggingPlaced = false;
  let draggedPlacedIdx = -1;

  // Input handlers
  canvas.addEventListener('mousedown', (e) => {
    resumeAudio();
    const { x, y } = getCanvasCoords(e);
    state.mouseX = x;
    state.mouseY = y;
    state.mouseDown = true;

    if (state.screen === 'title') {
      if (!state.showTutorialHasPlayed) {
        state.screen = 'tutorial';
        state.tutorialStep = 0;
        state.tutorialTimer = 0;
      } else {
        state.screen = 'play';
      }
      playClick();
      showHint(state, 'Seleziona un elemento dal pannello a sinistra');
      return;
    }

    if (state.screen === 'tutorial') {
      state.tutorialStep++;
      playClick();
      if (state.tutorialStep >= 3) {
        state.screen = 'play';
        state.showTutorialHasPlayed = true;
        saveToDisk(state);
        showHint(state, 'Seleziona un elemento dal pannello a sinistra');
      }
      return;
    }

    if (state.screen === 'chapter-complete') {
      if (state.celebrationTimer <= 0) {
        state.screen = 'play';
        playClick();
      }
      return;
    }

    // Check exit button click (top-left corner, 36x36)
    if (x >= 5 && x <= 41 && y >= 5 && y <= 41) {
      state.screen = 'title';
      state.titleAlpha = 1;
      state.placedElements = [];
      playClick();
      return;
    }

    // Check workspace click
    const wsElem = getWorkspaceElementAt(state, x, y);
    if (wsElem) {
      state.heldElement = wsElem;
      playPickup();
      return;
    }

    // Check placed element click
    const placedIdx = getPlacedElementAt(state, x, y);
    if (placedIdx >= 0) {
      isDraggingPlaced = true;
      draggedPlacedIdx = placedIdx;
      playPickup();
      return;
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getCanvasCoords(e);
    state.mouseX = x;
    state.mouseY = y;

    // Hover detection
    state.hoveredWorkspace = getWorkspaceElementAt(state, x, y);
    const placedIdx = getPlacedElementAt(state, x, y);
    state.hoveredElement = placedIdx >= 0 ? state.placedElements[placedIdx].id : null;

    // Drag placed element
    if (isDraggingPlaced && draggedPlacedIdx >= 0 && draggedPlacedIdx < state.placedElements.length) {
      const pe = state.placedElements[draggedPlacedIdx];
      pe.x = x;
      pe.y = y;
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    const { x, y } = getCanvasCoords(e);
    state.mouseX = x;
    state.mouseY = y;
    state.mouseDown = false;

    if (state.heldElement) {
      // Drop held element
      if (isInCombineArea(x)) {
        // Check if dropping on existing placed element
        const targetIdx = getPlacedElementAt(state, x, y);
        if (targetIdx >= 0) {
          // Try to combine
          tryCombine(state, state.heldElement, state.placedElements[targetIdx].id,
            state.placedElements[targetIdx].x, state.placedElements[targetIdx].y, targetIdx);
        } else {
          // Place element in combine area
          const pe: PlacedElement = {
            id: state.heldElement,
            x,
            y,
            vx: 0,
            vy: 0,
            scale: 1,
            alpha: 1,
          };
          state.placedElements.push(pe);
          playDrop();
        }
      }
      state.heldElement = null;
      return;
    }

    if (isDraggingPlaced) {
      // Check if dropped on another placed element
      const draggedElem = state.placedElements[draggedPlacedIdx];
      if (draggedElem) {
        for (let i = 0; i < state.placedElements.length; i++) {
          if (i === draggedPlacedIdx) continue;
          const other = state.placedElements[i];
          const dx = draggedElem.x - other.x;
          const dy = draggedElem.y - other.y;
          if (dx * dx + dy * dy < (ORB_RADIUS * 2) * (ORB_RADIUS * 2)) {
            // Try combine
            tryCombineIndices(state, draggedPlacedIdx, i);
            isDraggingPlaced = false;
            draggedPlacedIdx = -1;
            return;
          }
        }

        // If dragged outside combine area, remove
        if (!isInCombineArea(draggedElem.x)) {
          state.placedElements.splice(draggedPlacedIdx, 1);
          playDrop();
        }
      }

      isDraggingPlaced = false;
      draggedPlacedIdx = -1;
      return;
    }
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {
      clientX: state.mouseX,
      clientY: state.mouseY,
    });
    // Recalculate from state since we don't have a touch
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  // Scroll for workspace panel
  canvas.addEventListener('wheel', (e) => {
    const { x } = getCanvasCoords(e);
    if (x < PANEL_W) {
      state.scrollOffset = Math.max(0, Math.min(state.maxScroll, state.scrollOffset + e.deltaY * 0.5));
      e.preventDefault();
    }
  }, { passive: false });

  // Combine logic
  function tryCombine(state: GameState, elemA: string, elemB: string, atX: number, atY: number, removeIdx: number): void {
    const result = findRecipe(elemA, elemB);
    if (result) {
      const isNew = !state.discovered.has(result);

      // Remove the target placed element
      state.placedElements.splice(removeIdx, 1);

      // Start merge animation
      state.mergeAnim = {
        ax: state.mouseX,
        ay: state.mouseY,
        bx: atX,
        by: atY,
        targetX: (state.mouseX + atX) / 2,
        targetY: (state.mouseY + atY) / 2,
        elemA,
        elemB,
        result,
        timer: 0,
        maxTimer: 1.0,
      };

      playCombineWhoosh();

      if (isNew) {
        state.discovered.add(result);
        const depth = ELEMENTS[result]?.depth ?? 1;
        state.score += depth * 100;

        // Add to discovery log
        const elemAName = ELEMENTS[elemA]?.name ?? elemA;
        const elemBName = ELEMENTS[elemB]?.name ?? elemB;
        const resultName = ELEMENTS[result]?.name ?? result;
        addDiscoveryLog(state, resultName, `${elemAName} + ${elemBName}`);

        // Schedule discovery effects (after merge anim at 0.5)
        setTimeout(() => {
          playDiscoveryChime();
          state.discoveryAnim = {
            elementId: result,
            x: state.mergeAnim?.targetX ?? atX,
            y: state.mergeAnim?.targetY ?? atY,
            timer: 0,
            maxTimer: 2.0,
          };
          state.particles.push(...createDiscoveryBurst(
            state.mergeAnim?.targetX ?? atX,
            state.mergeAnim?.targetY ?? atY
          ));
        }, 500);

        // Check chapter completion
        checkChapterCompletion(state);
        saveToDisk(state);
      } else {
        // Already known: brief flash
        setTimeout(() => {
          const elem = ELEMENTS[result];
          if (elem) {
            state.particles.push(...createMergeParticles(
              state.mergeAnim?.targetX ?? atX,
              state.mergeAnim?.targetY ?? atY,
              elem.color, 10
            ));
          }
          showHint(state, `${ELEMENTS[result]?.name ?? result} — gia\u0300 scoperto`);
        }, 500);
      }
    } else {
      // Invalid combination
      playInvalidThud();
      state.particles.push(...createInvalidPuff(atX, atY));
      state.invalidAnim = {
        x: (state.mouseX + atX) / 2,
        y: (state.mouseY + atY) / 2,
        timer: 0,
        maxTimer: 1.5,
      };
      showHint(state, 'Questa combinazione non funziona. Prova un\'altra!');
    }
  }

  function tryCombineIndices(state: GameState, idxA: number, idxB: number): void {
    const a = state.placedElements[idxA];
    const b = state.placedElements[idxB];
    if (!a || !b) return;

    const result = findRecipe(a.id, b.id);
    if (result) {
      const isNew = !state.discovered.has(result);
      const targetX = (a.x + b.x) / 2;
      const targetY = (a.y + b.y) / 2;

      // Remove both (higher index first)
      const highIdx = Math.max(idxA, idxB);
      const lowIdx = Math.min(idxA, idxB);
      state.placedElements.splice(highIdx, 1);
      state.placedElements.splice(lowIdx, 1);

      state.mergeAnim = {
        ax: a.x,
        ay: a.y,
        bx: b.x,
        by: b.y,
        targetX,
        targetY,
        elemA: a.id,
        elemB: b.id,
        result,
        timer: 0,
        maxTimer: 1.0,
      };

      playCombineWhoosh();

      if (isNew) {
        state.discovered.add(result);
        const depth = ELEMENTS[result]?.depth ?? 1;
        state.score += depth * 100;

        // Add to discovery log
        const elemAName = ELEMENTS[a.id]?.name ?? a.id;
        const elemBName = ELEMENTS[b.id]?.name ?? b.id;
        const resultName = ELEMENTS[result]?.name ?? result;
        addDiscoveryLog(state, resultName, `${elemAName} + ${elemBName}`);

        setTimeout(() => {
          playDiscoveryChime();
          state.discoveryAnim = {
            elementId: result,
            x: targetX,
            y: targetY,
            timer: 0,
            maxTimer: 2.0,
          };
          state.particles.push(...createDiscoveryBurst(targetX, targetY));
        }, 500);

        checkChapterCompletion(state);
        saveToDisk(state);
      } else {
        setTimeout(() => {
          const elem = ELEMENTS[result];
          if (elem) {
            state.particles.push(...createMergeParticles(targetX, targetY, elem.color, 10));
          }
          showHint(state, `${ELEMENTS[result]?.name ?? result} — gia\u0300 scoperto`);
        }, 500);
      }
    } else {
      // Invalid
      playInvalidThud();
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      state.particles.push(...createInvalidPuff(midX, midY));
      state.invalidAnim = {
        x: midX,
        y: midY,
        timer: 0,
        maxTimer: 1.5,
      };
      showHint(state, 'Questa combinazione non funziona. Prova un\'altra!');
      // Bounce apart
      a.vx = (a.x - midX) * 3;
      a.vy = (a.y - midY) * 3;
      b.vx = (b.x - midX) * 3;
      b.vy = (b.y - midY) * 3;
    }
  }

  function checkChapterCompletion(state: GameState): void {
    const count = state.discovered.size;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (!state.chapterCompleted[i] && count >= CHAPTERS[i].requiredDiscoveries) {
        state.chapterCompleted[i] = true;
        state.currentChapter = i;
        state.score += (i + 1) * 500;

        // Delay chapter complete screen
        setTimeout(() => {
          state.screen = 'chapter-complete';
          state.celebrationTimer = CHAPTER_COMPLETE_DURATION;
          playChapterFanfare();
        }, 2500);
      }
    }
    // Update current chapter
    state.currentChapter = getChapterForDiscoveryCount(count);
  }

  function showHint(state: GameState, text: string): void {
    state.hintText = text;
    state.hintTimer = 3;
  }

  function addDiscoveryLog(state: GameState, name: string, recipe: string): void {
    state.discoveryLog.unshift({ name, recipe, timer: 10 });
    // Keep max 8 entries
    if (state.discoveryLog.length > 8) {
      state.discoveryLog = state.discoveryLog.slice(0, 8);
    }
  }

  // Game loop
  let lastTime = performance.now();

  function update(dt: number): void {
    // Title fade in
    if (state.screen === 'title') {
      state.titleAlpha += TITLE_FADE_SPEED * dt;
      state.titlePhase += dt;
    }

    // Tutorial timer
    if (state.screen === 'tutorial') {
      state.tutorialTimer += dt;
    }

    // Discovery log timers
    for (const entry of state.discoveryLog) {
      entry.timer -= dt;
    }
    state.discoveryLog = state.discoveryLog.filter(e => e.timer > 0);

    // Sparkles
    state.sparkles = updateSparkles(state.sparkles, dt, W, H);

    // Particles
    state.particles = updateParticles(state.particles, dt);

    // Discovery animation
    if (state.discoveryAnim) {
      state.discoveryAnim.timer += dt;
      if (state.discoveryAnim.timer >= state.discoveryAnim.maxTimer) {
        state.discoveryAnim = null;
      }
    }

    // Invalid animation
    if (state.invalidAnim) {
      state.invalidAnim.timer += dt;
      if (state.invalidAnim.timer >= state.invalidAnim.maxTimer) {
        state.invalidAnim = null;
      }
    }

    // Merge animation
    if (state.mergeAnim) {
      state.mergeAnim.timer += dt;
      if (state.mergeAnim.timer >= state.mergeAnim.maxTimer) {
        // Place result element
        const ma = state.mergeAnim;
        const resultElem = ELEMENTS[ma.result];
        if (resultElem) {
          state.placedElements.push({
            id: ma.result,
            x: ma.targetX,
            y: ma.targetY,
            vx: 0,
            vy: 0,
            scale: 1,
            alpha: 1,
          });
        }
        state.mergeAnim = null;
      }
    }

    // Hint timer
    if (state.hintTimer > 0) {
      state.hintTimer -= dt;
    }

    // Celebration timer
    if (state.celebrationTimer > 0) {
      state.celebrationTimer -= dt;
    }

    // Update placed element physics (bounce)
    for (const pe of state.placedElements) {
      if (Math.abs(pe.vx) > 0.1 || Math.abs(pe.vy) > 0.1) {
        pe.x += pe.vx * dt;
        pe.y += pe.vy * dt;
        pe.vx *= 0.9;
        pe.vy *= 0.9;

        // Keep in combine area
        const minX = COMBINE_AREA_X + ORB_RADIUS;
        const maxX = COMBINE_AREA_X + COMBINE_AREA_W - ORB_RADIUS;
        const minY = ORB_RADIUS + 10;
        const maxY = H - ORB_RADIUS - 10;
        if (pe.x < minX) { pe.x = minX; pe.vx *= -0.5; }
        if (pe.x > maxX) { pe.x = maxX; pe.vx *= -0.5; }
        if (pe.y < minY) { pe.y = minY; pe.vy *= -0.5; }
        if (pe.y > maxY) { pe.y = maxY; pe.vy *= -0.5; }
      }
    }

    // Cap placed elements to avoid clutter
    if (state.placedElements.length > 10) {
      state.placedElements.splice(0, state.placedElements.length - 10);
    }
  }

  function gameLoop(now: number): void {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    update(dt);
    render(ctx, state, now / 1000);

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}
