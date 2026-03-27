// ============================================================
// TinyEmpire — Main Game Class
// ============================================================

import type { GameState, AgeId, Unit, Building, BuildingType } from './types/index.ts';
import { setupCanvas, clearCanvas, CANVAS_WIDTH, CANVAS_HEIGHT, type CanvasHandle } from './core/canvas.ts';
import { GameCamera } from './core/camera.ts';
import { InputManager } from './core/input.ts';
import { GameLoop } from './core/loop.ts';
import { EventBus } from './core/events.ts';
import { isoToScreen, screenToIso } from './core/math.ts';
import { AGE_CONFIGS } from './data/ages.ts';
import { BUILDING_CONFIGS } from './data/buildings.ts';
import { generateMap } from './data/map-generator.ts';
import { createRenderer, Renderer } from './render/renderer.ts';
import { COLORS, getAgePalette } from './render/colors.ts';
import { cycleRenderStyle, getCurrentStyle } from './render/styles.ts';
import { ResourceSystem } from './systems/resource-system.ts';
import { BuildingSystem } from './systems/building-system.ts';
import { UnitSystem } from './systems/unit-system.ts';
import { SaveSystem } from './systems/save-system.ts';
import { ProgressionSystem } from './systems/progression-system.ts';
import { EnemySystem } from './systems/enemy-system.ts';
import { AnimalSystem } from './systems/animal-system.ts';
import { AnimalRenderer } from './render/animal-renderer.ts';
import { HUD } from './ui/hud.ts';
import { VillagerBar } from './ui/villager-bar.ts';
import { InfoPanel } from './ui/info-panel.ts';
import { BuildPanel } from './ui/build-panel.ts';
import { AgeCeremony } from './ui/age-ceremony.ts';
import { NotificationManager } from './ui/notifications.ts';
import { MilitaryPanel } from './ui/military-panel.ts';
import { Minimap } from './ui/minimap.ts';
import { RightPanel } from './ui/right-panel.ts';

const SCROLL_SPEED = 90;

// Train data for floating building tooltip
const TRAINABLE_UNITS: Partial<Record<string, import('./types/index.ts').UnitType[]>> = {
  townCenter:    ['villager'],
  barracks:      ['clubman', 'axeman', 'swordsman'],
  archeryRange:  ['archer', 'crossbowman', 'skirmisher'],
  stable:        ['scout', 'cavalry', 'knight'],
  siegeWorkshop: ['batteringRam', 'catapult'],
  castle:        ['knight', 'paladin', 'champion'],
  cannonFoundry: ['handCannoneer', 'bombardCannon'],
  temple:        ['priest'],
};

const UNIT_COSTS: Partial<Record<string, { food: number; wood: number; stone: number; gold: number }>> = {
  villager:      { food: 50, wood: 0, stone: 0, gold: 0 },
  clubman:       { food: 50, wood: 0, stone: 0, gold: 0 },
  axeman:        { food: 60, wood: 0, stone: 0, gold: 0 },
  swordsman:     { food: 80, wood: 0, stone: 0, gold: 0 },
  archer:        { food: 40, wood: 20, stone: 0, gold: 0 },
  crossbowman:   { food: 60, wood: 30, stone: 0, gold: 0 },
  skirmisher:    { food: 60, wood: 30, stone: 0, gold: 0 },
  scout:         { food: 60, wood: 0, stone: 0, gold: 0 },
  cavalry:       { food: 80, wood: 0, stone: 0, gold: 20 },
  knight:        { food: 100, wood: 0, stone: 0, gold: 50 },
  paladin:       { food: 120, wood: 0, stone: 0, gold: 70 },
  champion:      { food: 120, wood: 0, stone: 0, gold: 40 },
  batteringRam:  { food: 0, wood: 200, stone: 0, gold: 0 },
  catapult:      { food: 0, wood: 150, stone: 100, gold: 0 },
  handCannoneer: { food: 80, wood: 0, stone: 0, gold: 80 },
  bombardCannon: { food: 0, wood: 100, stone: 0, gold: 200 },
  priest:        { food: 60, wood: 0, stone: 0, gold: 50 },
};

interface FloatingTrainBtn { x: number; y: number; w: number; h: number; unitType: string; }

export class Game {
  state!: GameState;

  camera: GameCamera;
  input: InputManager;
  loop: GameLoop;
  events: EventBus;

  resourceSystem: ResourceSystem;
  buildingSystem: BuildingSystem;
  unitSystem: UnitSystem;
  saveSystem: SaveSystem;
  progressionSystem: ProgressionSystem;
  enemySystem: EnemySystem;
  animalSystem: AnimalSystem;
  private animalRenderer: AnimalRenderer;

  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  private canvasHandle: CanvasHandle;
  private renderer: Renderer;
  private hud: HUD;
  private villagerBar: VillagerBar;
  private infoPanel: InfoPanel;
  private buildPanel: BuildPanel;
  private ceremony: AgeCeremony;
  private notifications: NotificationManager;
  private militaryPanel: MilitaryPanel;
  private minimap: Minimap;
  private rightPanel: RightPanel;

  // Placement mode: the building type currently being placed, or null.
  placementMode: BuildingType | null = null;

  // Track whether the last click was consumed by UI so we don't double-fire
  private prevMouseDown = false;
  private prevRightMouseDown = false;

  // Track previous key states for press-edge detection (toggle on keydown only).
  private prevKeys = new Set<string>();

  tick = 0;
  private floatingTrainBtns: FloatingTrainBtn[] = [];

  constructor(canvasId: string) {
    const handle = setupCanvas(canvasId);
    this.canvasHandle = handle;
    this.ctx = handle.ctx;
    this.canvasWidth = CANVAS_WIDTH;
    this.canvasHeight = CANVAS_HEIGHT;

    this.events = new EventBus();
    this.camera = new GameCamera();
    this.input = new InputManager();

    this.input.onPan = (dx, dy) => {
      this.camera.pan(dx / this.camera.zoom, dy / this.camera.zoom);
    };
    this.input.onZoom = (factor) => {
      this.camera.zoomBy(factor);
    };

    this.resourceSystem = new ResourceSystem();
    this.buildingSystem = new BuildingSystem(this.events);
    this.unitSystem = new UnitSystem(this.events);
    this.saveSystem = new SaveSystem();
    this.progressionSystem = new ProgressionSystem(this.events);
    this.enemySystem = new EnemySystem(this.events);
    this.animalSystem = new AnimalSystem();
    this.animalRenderer = new AnimalRenderer();

    this.renderer = createRenderer(this.ctx);
    this.hud = new HUD();
    this.villagerBar = new VillagerBar();
    this.infoPanel = new InfoPanel();
    this.buildPanel = new BuildPanel();
    this.ceremony = new AgeCeremony();
    this.notifications = new NotificationManager();
    this.militaryPanel = new MilitaryPanel();
    this.minimap = new Minimap();
    this.rightPanel = new RightPanel();

    this.loop = new GameLoop({
      update: (dt) => this.update(dt),
      render: (interp) => this.render(interp),
      tickRate: 10,
    });

    this.input.init(handle.canvas);
    this.bindEvents();
  }

  // --------------------------------------------------------------------------
  // Event wiring for ceremony and notifications
  // --------------------------------------------------------------------------

  private bindEvents(): void {
    // Building completed toast
    this.events.on('buildingComplete', (e) => {
      this.notifications.add(`Built: ${e.building.type}`, 'green');
    });

    // Age advanced — trigger ceremony + toast
    this.events.on('ageAdvanced', (e) => {
      const ageName = AGE_CONFIGS[e.age]?.name ?? e.age;
      this.ceremony.start(ageName);
      this.notifications.add(`Age: ${ageName}!`, 'gold');
    });

    // Raid events
    this.events.on('raidIncoming', (_e) => {
      // Could trigger alarm sound or flashing UI in the future
    });
    this.events.on('raidDefeated', () => {
      // Victory fanfare placeholder
    });

    // Generic notification events emitted by other systems
    this.events.on('notification', (e) => {
      // Avoid a duplicate toast for age-advance messages (already handled above)
      if (!e.message.startsWith('Advanced to')) {
        const colorToken = this.hexToColorToken(e.color);
        this.notifications.add(e.message, colorToken);
      }
    });
  }

  private hexToColorToken(hex: string): 'green' | 'red' | 'gold' | 'blue' {
    const h = hex.toLowerCase();
    if (h === '#ffd040') return 'gold';
    if (h === '#60c040') return 'green';
    if (h === '#e04040') return 'red';
    if (h === '#3090d0') return 'blue';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (r > g && r > b) return 'red';
    if (g > r && g > b) return 'green';
    if (b > r && b > g) return 'blue';
    return 'gold';
  }

  init(): void {
    const saved = this.saveSystem.load();
    if (saved) {
      // Migrate old saves: patch missing fields
      for (const unit of saved.units) {
        if (!unit.owner) unit.owner = 'player';
      }
      if (saved.enemyState === undefined) {
        saved.enemyState = null;
        this.enemySystem.initEnemy(saved);
      }
      // Migrate: add training queue for old saves
      if ((saved as any).trainingQueue === undefined) {
        saved.trainingQueue = [];
      }
      this.state = saved;
      // Spawn wildlife for old saves
      if (this.animalSystem.animals.length === 0) {
        this.animalSystem.initAnimals(saved);
      }
    } else {
      this.state = this.createNewGame();
    }
  }

  createNewGame(): GameState {
    const MAP_W = 64;
    const MAP_H = 64;
    const CENTER_COL = Math.floor(MAP_W / 2);
    const CENTER_ROW = Math.floor(MAP_H / 2);

    const map = generateMap(MAP_W, MAP_H);

    const startAge: AgeId = 'stone';
    const ageConfig = AGE_CONFIGS[startAge];

    const state: GameState = {
      resources: { food: 200, wood: 200, stone: 0, gold: 0 },
      storageCaps: { ...ageConfig.storageCaps },
      rates: { food: 0, wood: 0, stone: 0, gold: 0 },
      population: 0,
      populationCap: 0,
      currentAge: startAge,
      ageIndex: ageConfig.index,
      buildings: [],
      units: [],
      map,
      prestige: {
        dynastyPoints: 0,
        totalDpEarned: 0,
        runsCompleted: 0,
        upgrades: {},
        relics: [],
        achievements: [],
      },
      tickCount: 0,
      totalPlayTime: 0,
      lastSaveTime: Date.now(),
      lastOnlineTime: Date.now(),
      nextBuildingId: 1,
      nextUnitId: 1,
      selectedBuildingId: null,
      selectedUnitIds: [],
      gameSpeed: 1,
      paused: false,
      trainingQueue: [],
      enemyState: null,
    };

    // Place town center
    this.buildingSystem.placeBuilding(state, 'townCenter', {
      col: CENTER_COL - 1,
      row: CENTER_ROW - 1,
    });

    const tc = state.buildings[0];
    if (tc) {
      tc.constructionProgress = 1;
      // Manually apply population cap bonus since we skip the normal build cycle
      state.populationCap += 5;
    }

    // Spawn 3 villagers
    const spawnBase = isoToScreen(CENTER_COL + 1, CENTER_ROW + 2);
    const offsets = [
      { x: -12, y: 6 },
      { x: 0, y: 10 },
      { x: 14, y: 4 },
    ];

    for (const offset of offsets) {
      const unit: Unit = {
        id: state.nextUnitId++,
        type: 'villager',
        owner: 'player',
        pos: { x: spawnBase.x + offset.x, y: spawnBase.y + offset.y },
        targetPos: null,
        hp: 25,
        maxHp: 25,
        state: 'idle',
        assignedTo: null,
        carryType: null,
        carryAmount: 0,
        animFrame: 0,
        animTimer: 0,
        facingRight: true,
      };
      state.units.push(unit);
      state.population++;
    }

    // Initialize enemy village and wildlife
    this.enemySystem.initEnemy(state);
    this.animalSystem.initAnimals(state);

    // Center camera
    const tcScreen = isoToScreen(CENTER_COL, CENTER_ROW);
    this.camera.targetX = tcScreen.x;
    this.camera.targetY = tcScreen.y;
    this.camera.x = tcScreen.x;
    this.camera.y = tcScreen.y;

    return state;
  }

  update(dt: number): void {
    // Ceremony and notifications run independently of pause state
    if (this.ceremony.isActive()) {
      this.ceremony.update(dt);
    }
    this.notifications.update(dt);

    if (this.state.paused) return;

    const scaledDt = dt * this.state.gameSpeed;

    this.handleInput(scaledDt);
    this.resourceSystem.update(this.state, scaledDt);
    this.buildingSystem.update(this.state, scaledDt);
    this.unitSystem.update(this.state, scaledDt);
    this.enemySystem.update(this.state, scaledDt);
    this.animalSystem.update(this.state, scaledDt);
    this.camera.update(scaledDt);
    this.saveSystem.autoSave(this.state);

    this.state.tickCount++;
    this.state.totalPlayTime += scaledDt;
    this.tick = this.state.tickCount;
  }

  render(_interp: number): void {
    const { ctx, canvasWidth, canvasHeight, state } = this;
    const uiCtx = this.canvasHandle.uiCtx;

    // ── LAYER 1: Game world on offscreen 480x270 canvas (pixel art) ──
    clearCanvas(ctx, canvasWidth, canvasHeight);

    this.renderer.render(
      state,
      this.camera,
      state.tickCount,
      canvasWidth,
      canvasHeight,
    );

    // Animals (world-space, rendered via camera)
    this.camera.applyTransform(ctx, canvasWidth, canvasHeight);
    this.animalRenderer.render(ctx, this.animalSystem.animals, state.tickCount);
    this.camera.resetTransform(ctx);

    // Enemy camp (world-space)
    if (state.enemyState) {
      this.renderEnemyCamp(ctx, state, canvasWidth, canvasHeight);
    }

    // Selection highlights (world-space)
    this.renderSelectionHighlights(ctx, state, canvasWidth, canvasHeight);

    // Ghost building preview (world-space)
    if (this.placementMode !== null) {
      this.renderGhostBuilding(ctx, canvasWidth, canvasHeight);
    }

    // ── BLIT: copy pixel-art to display canvas + set up hi-res UI transform ──
    this.canvasHandle.present();

    // ── LAYER 2: UI on display canvas at native resolution (sharp text) ──
    // present() already set up uiCtx with scale transform → 480x270 logical coords
    this.hud.render(uiCtx, state, canvasWidth, canvasHeight, this.loop.fps);
    this.villagerBar.render(uiCtx, state, canvasWidth, canvasHeight);
    // Floating tooltip (units + buildings with train buttons)
    this.renderUnitTooltip(uiCtx, state, canvasWidth, canvasHeight);

    // Unified right-side tab panel system (build, army, map, age)
    this.rightPanel.render(
      uiCtx, state, this.camera, this.hud,
      this.buildPanel, this.militaryPanel, this.minimap,
      this.animalSystem.animals,
      canvasWidth, canvasHeight, this.tick,
    );

    if (this.placementMode !== null) {
      this.renderPlacementHint(uiCtx, canvasWidth, canvasHeight);
    }

    this.notifications.render(uiCtx, canvasWidth, canvasHeight);

    if (this.ceremony.isActive()) {
      this.ceremony.render(uiCtx, canvasWidth, canvasHeight);
    }

    // Reset the display context transform for next frame
    uiCtx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Draw a gold outline around the selected building and a circle under
   * the selected unit. Must be called while the canvas is in world-space
   * (camera transform applied).
   */
  private renderSelectionHighlights(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (state.selectedBuildingId === null && state.selectedUnitIds.length === 0) return;

    // Apply camera transform so we draw in world-space
    this.camera.applyTransform(ctx, canvasWidth, canvasHeight);

    // Selected building — gold border around its iso tile footprint center
    if (state.selectedBuildingId !== null) {
      const building = state.buildings.find(b => b.id === state.selectedBuildingId);
      if (building) {
        const size = this.getBuildingSizeForHighlight(building);
        const cx = isoToScreen(
          building.tile.col + (size - 1) / 2,
          building.tile.row + (size - 1) / 2,
        );
        const hw = size * 14;
        const hh = size * 7;

        ctx.save();
        ctx.strokeStyle = '#FFD040';
        ctx.lineWidth = 1.5 / this.camera.zoom;
        ctx.setLineDash([3 / this.camera.zoom, 2 / this.camera.zoom]);
        ctx.strokeRect(cx.x - hw, cx.y - hh - size * 10, hw * 2, hh * 2 + size * 10);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // Selected units — small gold circle under each
    for (const uid of state.selectedUnitIds) {
      const unit = state.units.find(u => u.id === uid);
      if (!unit) continue;

      ctx.save();
      ctx.strokeStyle = '#FFD040';
      ctx.lineWidth = 1 / this.camera.zoom;
      ctx.beginPath();
      ctx.ellipse(unit.pos.x, unit.pos.y + 2, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.camera.resetTransform(ctx);
  }

  // ---- Enemy camp rendering (world-space) -----------------------------

  private renderEnemyCamp(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (!state.enemyState) return;
    const { villageTile } = state.enemyState;
    const pos = isoToScreen(villageTile.col, villageTile.row);
    const cx = pos.x;
    const cy = pos.y;

    this.camera.applyTransform(ctx, canvasWidth, canvasHeight);
    ctx.save();

    // Ground: dark dirt circle
    ctx.fillStyle = 'rgba(80, 40, 20, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main tent — red triangular tent
    ctx.fillStyle = '#8B1A1A';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx - 12, cy);
    ctx.closePath();
    ctx.fill();

    // Tent shading (darker right side)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 12, cy);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();

    // Tent opening (dark)
    ctx.fillStyle = '#1A0A00';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 4, cy);
    ctx.lineTo(cx - 4, cy);
    ctx.closePath();
    ctx.fill();

    // Tent pole top
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(cx - 1, cy - 18, 2, 3);

    // Skull flag on top (enemy marker)
    const tick = state.tickCount;
    const wave = Math.sin(tick * 0.08) * 1.5;
    // Flag pole
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(cx, cy - 25);
    ctx.stroke();
    // Red flag
    ctx.fillStyle = '#D03030';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 25);
    ctx.lineTo(cx + 6 + wave, cy - 23);
    ctx.lineTo(cx, cy - 21);
    ctx.closePath();
    ctx.fill();
    // Skull symbol on flag (small white X)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx + 2, cy - 24, 1, 1);
    ctx.fillRect(cx + 3, cy - 23, 1, 1);
    ctx.fillRect(cx + 4, cy - 24, 1, 1);

    // Side tent (smaller, offset)
    ctx.fillStyle = '#6B1010';
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy - 8);
    ctx.lineTo(cx + 22, cy + 2);
    ctx.lineTo(cx + 6, cy + 2);
    ctx.closePath();
    ctx.fill();

    // Campfire (between tents)
    ctx.fillStyle = '#FF6020';
    const flicker = Math.sin(tick * 0.2) * 0.5 + 0.5;
    ctx.globalAlpha = 0.7 + flicker * 0.3;
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD040';
    ctx.beginPath();
    ctx.arc(cx + 4, cy, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Weapon rack (sticks)
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 2);
    ctx.lineTo(cx - 12, cy - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 2);
    ctx.lineTo(cx - 14, cy - 10);
    ctx.stroke();

    ctx.restore();
    this.camera.resetTransform(ctx);
  }

  // ---- Ghost building rendering ---------------------------------------

  private renderGhostBuilding(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (!this.placementMode) return;

    const inputState = this.input.getState();
    const tile = this.mouseTile(inputState.mouseX, inputState.mouseY, canvasWidth, canvasHeight);
    if (!tile) return;

    const buildingCfg = BUILDING_CONFIGS[this.placementMode];
    if (!buildingCfg) return;

    const valid = this.buildingSystem.isTileFree(
      this.state,
      tile.col,
      tile.row,
      buildingCfg.size,
    );

    // Apply camera transform so we draw in world space
    this.camera.applyTransform(ctx, canvasWidth, canvasHeight);
    ctx.save();
    ctx.globalAlpha = 0.65;

    // Tint each footprint tile with an iso-diamond overlay
    for (let dc = 0; dc < buildingCfg.size.cols; dc++) {
      for (let dr = 0; dr < buildingCfg.size.rows; dr++) {
        const ts = isoToScreen(tile.col + dc, tile.row + dr);
        ctx.fillStyle = valid ? 'rgba(96, 192, 64, 0.35)' : 'rgba(192, 64, 64, 0.35)';
        ctx.beginPath();
        ctx.moveTo(ts.x,      ts.y - 8);
        ctx.lineTo(ts.x + 16, ts.y);
        ctx.lineTo(ts.x,      ts.y + 8);
        ctx.lineTo(ts.x - 16, ts.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Ghost building silhouette centered on footprint
    const size = Math.max(buildingCfg.size.cols, buildingCfg.size.rows);
    const centerCol = tile.col + (buildingCfg.size.cols - 1) / 2;
    const centerRow = tile.row + (buildingCfg.size.rows - 1) / 2;
    const center = isoToScreen(centerCol, centerRow);
    const bw = 8 + size * 6;
    const bh = 6 + size * 4;

    ctx.fillStyle = valid ? 'rgba(96, 192, 64, 0.5)' : 'rgba(192, 64, 64, 0.5)';
    ctx.fillRect(center.x - bw / 2, center.y - bh, bw, bh);

    // Roof triangle
    ctx.fillStyle = valid ? 'rgba(64, 160, 48, 0.5)' : 'rgba(160, 48, 48, 0.5)';
    ctx.beginPath();
    ctx.moveTo(center.x,              center.y - bh - size * 2);
    ctx.lineTo(center.x + bw / 2 + 1, center.y - bh);
    ctx.lineTo(center.x - bw / 2 - 1, center.y - bh);
    ctx.closePath();
    ctx.fill();

    // Age-colored accent dot (visual identity hint)
    const palette = getAgePalette(this.state.currentAge);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(center.x - 2, center.y - bh / 2 - 1, 4, 3);

    // Outline
    ctx.strokeStyle = valid ? 'rgba(96, 192, 64, 0.9)' : 'rgba(192, 64, 64, 0.9)';
    ctx.lineWidth = 0.75;
    ctx.strokeRect(center.x - bw / 2, center.y - bh, bw, bh);

    ctx.restore();
    this.camera.resetTransform(ctx);
  }

  /**
   * Render compact floating tooltips above selected units and buildings.
   */
  private renderUnitTooltip(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    // ---- Unit tooltip ----
    if (state.selectedUnitIds.length > 0) {
      const unit = state.units.find(u => u.id === state.selectedUnitIds[0]);
      if (unit) {
        const screen = this.camera.worldToScreen(unit.pos.x, unit.pos.y, canvasWidth, canvasHeight);
        const name = unit.type.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        let status: string = unit.state;
        if (unit.type === 'villager' && unit.carryType) status = unit.carryType;
        const extra = state.selectedUnitIds.length > 1 ? `+${state.selectedUnitIds.length - 1}` : '';
        this.drawFloatingTooltip(ctx, screen.x, screen.y - 24, name, unit.hp, unit.maxHp, status, extra, canvasWidth, canvasHeight);
      }
      return;
    }

    // ---- Building tooltip with train buttons ----
    if (state.selectedBuildingId !== null) {
      const building = state.buildings.find(b => b.id === state.selectedBuildingId);
      if (building) {
        this.renderBuildingTooltip(ctx, state, building, canvasWidth, canvasHeight);
      }
    }
  }

  private renderBuildingTooltip(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    building: Building,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    this.floatingTrainBtns = [];
    const size = this.getBuildingSizeForHighlight(building);
    const center = isoToScreen(
      building.tile.col + (size - 1) / 2,
      building.tile.row + (size - 1) / 2,
    );
    const screen = this.camera.worldToScreen(center.x, center.y, canvasWidth, canvasHeight);
    const name = building.type.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();

    const trainable = TRAINABLE_UNITS[building.type] ?? [];
    const queueItems = (state.trainingQueue ?? []).filter(q => q.buildingId === building.id);
    const hasTraining = trainable.length > 0 && building.constructionProgress >= 1;

    // Calculate tooltip size
    const tipW = hasTraining ? 80 : 62;
    const headerH = 20;
    const trainBtnH = 12;
    const trainGap = 1;
    const queueH = queueItems.length > 0 ? 14 : 0;
    const tipH = headerH + (hasTraining ? trainable.length * (trainBtnH + trainGap) + 4 + queueH : 0);

    let tipX = screen.x - tipW / 2;
    let tipY = screen.y - size * 12 - tipH - 6;
    tipX = Math.max(2, Math.min(canvasWidth - tipW - 2, tipX));
    tipY = Math.max(2, Math.min(canvasHeight - tipH - 26, tipY));

    // Background
    ctx.fillStyle = 'rgba(30, 22, 12, 0.92)';
    ctx.beginPath();
    ctx.roundRect(tipX, tipY, tipW, tipH, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 160, 80, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(tipX + 0.5, tipY + 0.5, tipW - 1, tipH - 1, 3);
    ctx.stroke();

    // Name
    ctx.fillStyle = '#FFD040';
    ctx.font = 'bold 6px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(name.length > 14 ? name.slice(0, 14) : name, tipX + 3, tipY + 2);

    // Status
    const status = building.constructionProgress < 1
      ? `${Math.floor(building.constructionProgress * 100)}%`
      : `Lv${building.level}`;
    ctx.fillStyle = '#C0B898';
    ctx.font = '5px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(status, tipX + tipW - 3, tipY + 3);
    ctx.textAlign = 'left';

    // HP bar
    const barX = tipX + 3;
    const barY = tipY + 10;
    const barW = tipW - 6;
    const hpRatio = building.maxHp > 0 ? building.hp / building.maxHp : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(barX, barY, barW, 2);
    ctx.fillStyle = hpRatio > 0.5 ? '#60C040' : '#E04040';
    ctx.fillRect(barX, barY, barW * hpRatio, 2);

    // HP numbers
    ctx.fillStyle = '#C0B898';
    ctx.font = '5px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${Math.ceil(building.hp)}/${building.maxHp}`, tipX + 3, tipY + 14);

    if (!hasTraining) return;

    // ---- Train buttons ----
    let btnY = tipY + headerH + 2;
    const btnW = tipW - 6;

    for (const unitType of trainable) {
      const cost = UNIT_COSTS[unitType];
      const canAfford = cost
        ? state.resources.food >= cost.food && state.resources.wood >= cost.wood &&
          state.resources.stone >= cost.stone && state.resources.gold >= cost.gold
        : false;
      const queuedPop = (state.trainingQueue ?? []).length;
      const atCap = state.population + queuedPop >= state.populationCap;
      const enabled = canAfford && !atCap;

      const bx = tipX + 3;
      const by = btnY;

      this.floatingTrainBtns.push({ x: bx, y: by, w: btnW, h: trainBtnH, unitType });

      // Button bg
      ctx.fillStyle = enabled ? 'rgba(80, 60, 30, 0.8)' : 'rgba(40, 30, 20, 0.5)';
      ctx.fillRect(bx, by, btnW, trainBtnH);
      ctx.strokeStyle = enabled ? 'rgba(200,160,80,0.4)' : 'rgba(80,60,30,0.3)';
      ctx.lineWidth = 0.3;
      ctx.strokeRect(bx + 0.5, by + 0.5, btnW - 1, trainBtnH - 1);

      // Unit name
      const uname = unitType.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()).trim();
      ctx.fillStyle = enabled ? '#F0E8D0' : '#706050';
      ctx.font = 'bold 5px "Segoe UI", Arial, sans-serif';
      ctx.fillText(uname.length > 10 ? uname.slice(0, 10) : uname, bx + 2, by + 2);

      // Cost compact
      if (cost) {
        const parts: string[] = [];
        if (cost.food > 0) parts.push(`F${cost.food}`);
        if (cost.wood > 0) parts.push(`W${cost.wood}`);
        if (cost.stone > 0) parts.push(`S${cost.stone}`);
        if (cost.gold > 0) parts.push(`G${cost.gold}`);
        ctx.fillStyle = enabled ? '#C8A050' : '#605040';
        ctx.font = '4px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(parts.join(' '), bx + btnW - 2, by + 7);
        ctx.textAlign = 'left';
      }

      btnY += trainBtnH + trainGap;
    }

    // Queue display
    if (queueItems.length > 0) {
      const qi = queueItems[0];
      const pct = Math.floor(qi.progress * 100);
      ctx.fillStyle = '#C8A050';
      ctx.font = '4px "Segoe UI", Arial, sans-serif';
      ctx.fillText(`Training: ${pct}%`, tipX + 3, btnY + 2);
      // Mini progress bar
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(tipX + 3, btnY + 8, btnW, 2);
      ctx.fillStyle = '#C8A050';
      ctx.fillRect(tipX + 3, btnY + 8, btnW * qi.progress, 2);
      if (queueItems.length > 1) {
        ctx.fillStyle = '#807060';
        ctx.textAlign = 'right';
        ctx.fillText(`+${queueItems.length - 1} queued`, tipX + tipW - 3, btnY + 2);
        ctx.textAlign = 'left';
      }
    }
  }

  private drawFloatingTooltip(
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number,
    name: string,
    hp: number, maxHp: number,
    status: string,
    extra: string,
    canvasWidth: number, canvasHeight: number,
  ): void {
    const tipW = 62;
    const tipH = 20;
    let tipX = sx - tipW / 2;
    let tipY = sy - tipH;

    // Clamp
    tipX = Math.max(2, Math.min(canvasWidth - tipW - 2, tipX));
    tipY = Math.max(2, Math.min(canvasHeight - tipH - 26, tipY));

    // Background
    ctx.fillStyle = 'rgba(30, 22, 12, 0.9)';
    ctx.beginPath();
    ctx.roundRect(tipX, tipY, tipW, tipH, 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(200, 160, 80, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(tipX + 0.5, tipY + 0.5, tipW - 1, tipH - 1, 2);
    ctx.stroke();

    // Name
    ctx.fillStyle = '#FFD040';
    ctx.font = 'bold 6px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(name.length > 12 ? name.slice(0, 12) : name, tipX + 3, tipY + 2);

    // Extra (multi-select count)
    if (extra) {
      ctx.textAlign = 'right';
      ctx.fillText(extra, tipX + tipW - 3, tipY + 2);
      ctx.textAlign = 'left';
    }

    // HP bar
    const barX = tipX + 3;
    const barY = tipY + 10;
    const barW = tipW - 6;
    const hpRatio = maxHp > 0 ? hp / maxHp : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(barX, barY, barW, 2);
    ctx.fillStyle = hpRatio > 0.5 ? '#60C040' : '#E04040';
    ctx.fillRect(barX, barY, barW * hpRatio, 2);

    // Status + HP numbers
    ctx.fillStyle = '#C0B898';
    ctx.font = '5px "Segoe UI", Arial, sans-serif';
    ctx.fillText(status, tipX + 3, tipY + 14);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(hp)}/${maxHp}`, tipX + tipW - 3, tipY + 14);
    ctx.textAlign = 'left';
  }

  private renderPlacementHint(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (!this.placementMode) return;
    const cfg = BUILDING_CONFIGS[this.placementMode];
    const msg = `Placing: ${cfg?.name ?? this.placementMode}  |  LMB to place  |  RMB/ESC to cancel`;

    const barH = 12;
    const barY = canvasHeight - barH - 14;

    ctx.fillStyle = 'rgba(58, 42, 26, 0.88)';
    ctx.fillRect(0, barY, canvasWidth, barH);

    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(0, barY, canvasWidth, 1);

    ctx.fillStyle = COLORS.ui.textGold;
    ctx.font = '8px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(msg, canvasWidth / 2, barY + barH / 2);
    ctx.textAlign = 'left';
  }

  // ---- Mouse → tile coordinate conversion ----------------------------

  private mouseTile(
    screenX: number,
    screenY: number,
    canvasWidth: number,
    canvasHeight: number,
  ): { col: number; row: number } | null {
    const world = this.camera.screenToWorld(screenX, screenY, canvasWidth, canvasHeight);
    const iso = screenToIso(world.x, world.y);
    const col = Math.floor(iso.x);
    const row = Math.floor(iso.y);

    const map = this.state.map;
    if (col < 0 || row < 0 || col >= map.width || row >= map.height) return null;
    return { col, row };
  }

  /** Returns a tile-size number suitable for selection highlight sizing. */
  private getBuildingSizeForHighlight(building: Building): number {
    const SIZE_MAP: Record<string, number> = {
      house: 1, lumberCamp: 1, miningCamp: 1, watchTower: 1,
      stoneWall: 1, gate: 1, mill: 1, blacksmith: 1, outpost: 1,
      bombardTower: 1, granary: 1, lumberYard: 1, stoneVault: 1, treasury: 1,
      townCenter: 2, farm: 2, market: 2, bank: 2,
      barracks: 2, archeryRange: 2, stable: 2, siegeWorkshop: 2,
      university: 2, temple: 2, monastery: 2, cannonFoundry: 2,
      castle: 3, imperialPalace: 3, wonder: 3,
    };
    return SIZE_MAP[building.type] ?? 1;
  }

  handleInput(dt: number): void {
    const inputState = this.input.getState();
    const { mouseX, mouseY } = inputState;
    const keys = inputState.keys;

    // ---- Keyboard shortcut: B → toggle build tab (press edge only) ----
    if (keys.has('KeyB') && !this.prevKeys.has('KeyB')) {
      this.rightPanel.toggle('build');
    }

    // ---- Keyboard shortcut: M → toggle army tab -------------------------
    if (keys.has('KeyM') && !this.prevKeys.has('KeyM')) {
      this.rightPanel.toggle('army');
    }

    // ---- Keyboard shortcut: ESC → cancel placement or close panel -------
    if (keys.has('Escape') && !this.prevKeys.has('Escape')) {
      if (this.placementMode !== null) {
        this.placementMode = null;
        this.buildPanel.clearSelection();
      } else if (this.rightPanel.isOpen()) {
        this.rightPanel.close();
      }
    }

    // ---- Keyboard shortcut: V → cycle render style -----------------------
    if (keys.has('KeyV') && !this.prevKeys.has('KeyV')) {
      cycleRenderStyle();
      const styleName = getCurrentStyle().name;
      this.notifications.add(`Style: ${styleName}`, 'gold');
    }

    // ---- Click detection: mouse DOWN edge (not a drag) ------------------
    const clickOccurred = inputState.mouseDown && !this.prevMouseDown && !inputState.isDragging;
    if (clickOccurred && !this.ceremony.isActive()) {
      // Route to build panel / placement / right panel tabs
      this.handleLeftClick(mouseX, mouseY);
    }

    // ---- Right-click edge → cancel placement or move units ---------------
    const rightClickOccurred = inputState.rightMouseDown && !this.prevRightMouseDown;
    if (rightClickOccurred) {
      if (this.placementMode !== null) {
        this.placementMode = null;
        this.buildPanel.clearSelection();
      } else if (this.state.selectedUnitIds.length > 0) {
        // Move selected units to right-click position
        const worldPos = this.camera.screenToWorld(mouseX, mouseY, this.canvasWidth, this.canvasHeight);
        this.unitSystem.commandMove(this.state, worldPos.x, worldPos.y);
      }
    }

    // ---- WASD / Arrow key camera pan (only when window is focused) ------
    if (document.hasFocus()) {
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  this.camera.pan(-SCROLL_SPEED * dt, 0);
      if (keys.has('KeyD') || keys.has('ArrowRight')) this.camera.pan(SCROLL_SPEED * dt, 0);
      if (keys.has('KeyW') || keys.has('ArrowUp'))    this.camera.pan(0, -SCROLL_SPEED * dt);
      if (keys.has('KeyS') || keys.has('ArrowDown'))  this.camera.pan(0, SCROLL_SPEED * dt);
    }

    // ---- Preserve previous state for next frame's edge detection --------
    this.prevMouseDown      = inputState.mouseDown;
    this.prevRightMouseDown = inputState.rightMouseDown;
    this.prevKeys           = new Set(keys);
  }

  /**
   * Route a left-click through the build panel and placement system.
   * Returns true if the click was consumed (caller should skip other handlers).
   */
  private handleLeftClick(mouseX: number, mouseY: number): boolean {
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    // ---- Unified right panel (build, army, map, age tabs) ----------------
    if (this.rightPanel.handleClick(
      mouseX, mouseY, this.state, this.camera, w, h,
      this.buildPanel, this.militaryPanel, this.minimap,
      this.hud, this.progressionSystem,
    )) {
      // If the build tab is active and a building was selected, sync placement mode
      if (this.rightPanel.isOpen('build')) {
        this.placementMode = this.buildPanel.getSelectedBuilding();
      }
      return true;
    }

    // ---- Menu button (New Game) -----------------------------------------
    const menuResult = this.hud.handleMenuClick(mouseX, mouseY);
    if (menuResult === 'newGame') {
      this.saveSystem.deleteSave();
      this.state = this.createNewGame();
      this.infoPanel.clearSelection();
      this.placementMode = null;
      this.buildPanel.clearSelection();
      this.notifications.add('New game started!', 'gold');
      return true;
    }

    // ---- Villager bar (bottom strip) ------------------------------------
    if (this.villagerBar.handleClick(mouseX, mouseY, this.state, this.unitSystem)) {
      return true;
    }

    // ---- Placement mode: click on the map to place ----------------------
    if (this.placementMode !== null) {
      const tile = this.mouseTile(mouseX, mouseY, w, h);
      if (tile) {
        const placed = this.buildingSystem.placeBuilding(this.state, this.placementMode, tile);
        if (placed) {
          const cfg = BUILDING_CONFIGS[this.placementMode];
          // Large buildings (>1 tile): exit placement after one placement
          if (cfg && (cfg.size.cols > 1 || cfg.size.rows > 1)) {
            this.placementMode = null;
            this.buildPanel.clearSelection();
          }
          // 1×1 buildings stay active for easy chaining (walls, houses, etc.)
        }
      }
      return true; // Placement consumed the click
    }

    // ---- Floating train buttons (on building tooltip) -------------------
    for (const btn of this.floatingTrainBtns) {
      if (mouseX >= btn.x && mouseX <= btn.x + btn.w &&
          mouseY >= btn.y && mouseY <= btn.y + btn.h) {
        this.unitSystem.trainUnit(this.state, btn.unitType as import('./types/index.ts').UnitType);
        return true;
      }
    }

    // ---- Map selection: UNITS first (small targets), then buildings ------
    const worldPos = this.camera.screenToWorld(mouseX, mouseY, w, h);
    const hitUnit = this.findUnitNear(worldPos.x, worldPos.y, 12);
    if (hitUnit) {
      this.state.selectedUnitIds = [hitUnit.id];
      this.state.selectedBuildingId = null;
      this.infoPanel.setSelectedUnit(hitUnit);
      return true;
    }

    const tile = this.mouseTile(mouseX, mouseY, w, h);
    if (tile) {
      const hitBuilding = this.findBuildingAtTile(tile.col, tile.row);
      if (hitBuilding) {
        this.state.selectedBuildingId = hitBuilding.id;
        this.state.selectedUnitIds = [];
        this.infoPanel.setSelectedBuilding(hitBuilding);
        return true;
      }
    }

    // Nothing hit — deselect
    this.state.selectedBuildingId = null;
    this.state.selectedUnitIds = [];
    this.infoPanel.clearSelection();

    return false;
  }

  /** Returns the building whose tile footprint includes (col, row), or null. */
  private findBuildingAtTile(col: number, row: number): Building | null {
    for (const building of this.state.buildings) {
      const size = this.getBuildingSizeForHighlight(building);
      if (
        col >= building.tile.col &&
        col <  building.tile.col + size &&
        row >= building.tile.row &&
        row <  building.tile.row + size
      ) {
        return building;
      }
    }
    return null;
  }

  /** Returns the closest player-owned unit to (wx, wy) within `radius` world-pixels, or null. */
  private findUnitNear(wx: number, wy: number, radius: number): Unit | null {
    let best: Unit | null = null;
    let bestDist = radius;
    for (const unit of this.state.units) {
      if (unit.owner !== 'player') continue;
      const dx = unit.pos.x - wx;
      const dy = unit.pos.y - wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = unit;
      }
    }
    return best;
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
  }
}
