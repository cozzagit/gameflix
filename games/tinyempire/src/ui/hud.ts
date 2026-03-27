// ============================================================
// TinyEmpire — HUD Renderer
// ============================================================

import type { GameState } from '../types/index.ts';
import { COLORS } from '../render/colors.ts';
import { AGE_CONFIGS, AGE_ORDER } from '../data/ages.ts';
import type { ProgressionSystem } from '../systems/progression-system.ts';

// Layout
const TOP_BAR_HEIGHT = 26;
const PADDING_X = 8;
const ICON_SIZE = 9;
const COLUMN_WIDTH = 72;

// Age panel
const AGE_PANEL_W = 120;
const AGE_PANEL_PAD = 6;
const AGE_BTN_H = 18;
const REQ_LINE_H = 11;
const AGE_PANEL_MARGIN = 4;

// Fonts — clean sans-serif for UI, rendered at native display resolution
const FONT_MAIN = 'bold 9px "Segoe UI", Arial, sans-serif';
const FONT_SMALL = '8px "Segoe UI", Arial, sans-serif';
const FONT_TINY = '7px "Segoe UI", Arial, sans-serif';
const FONT_RATE = '7px "Segoe UI", Arial, sans-serif';

const RESOURCE_ORDER = ['food', 'wood', 'stone', 'gold'] as const;

const RESOURCE_ICON_COLORS: Record<string, string> = {
  food: COLORS.resources.food,
  wood: COLORS.resources.wood,
  stone: COLORS.resources.stone,
  gold: COLORS.resources.gold,
};

const BUILDING_LABELS: Record<string, string> = {
  lumberCamp: 'Lumber Camp', miningCamp: 'Mining Camp',
  barracks: 'Barracks', market: 'Market', stoneWall: 'Stone Wall',
  university: 'University', castle: 'Castle', townCenter: 'Town Center',
  farm: 'Farm', house: 'House', mill: 'Mill', granary: 'Granary',
};

function formatNum(n: number): string {
  if (n < 0) return '0';
  if (n < 10000) return Math.floor(n).toString();
  if (n < 100000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.floor(n / 1000)}k`;
}

function formatRate(r: number): string {
  if (Math.abs(r) < 0.01) return '+0.0';
  const sign = r >= 0 ? '+' : '';
  return `${sign}${r.toFixed(1)}`;
}

interface ButtonBounds { x: number; y: number; w: number; h: number; }

// Menu button
const MENU_BTN_W = 36;
const MENU_BTN_H = 11;

export class HUD {
  private lastButtonBounds: ButtonBounds | null = null;
  private lastCanAllAdvance = false;
  private menuBtnBounds: ButtonBounds | null = null;
  private confirmingNewGame = false;

  render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
    fps: number,
  ): void {
    this.drawTopBar(ctx, state, canvasWidth);
    this.drawMenuButton(ctx, canvasWidth);
    this.drawFpsCounter(ctx, fps, canvasHeight);
  }

  renderAgePanel(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
    overrideX?: number,
    overrideY?: number,
  ): void {
    this.drawAgePanel(ctx, state, canvasWidth, canvasHeight, overrideX, overrideY);
  }

  handleAgeClick(
    x: number, y: number,
    state: GameState,
    progressionSystem: ProgressionSystem,
  ): boolean {
    if (!this.lastButtonBounds || !this.lastCanAllAdvance) return false;
    const b = this.lastButtonBounds;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return progressionSystem.advanceAge(state);
    }
    return false;
  }

  /**
   * Handle click on the menu button area. Returns 'newGame' if confirmed, null otherwise.
   */
  handleMenuClick(x: number, y: number): 'newGame' | null {
    if (!this.menuBtnBounds) return null;
    const b = this.menuBtnBounds;
    if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) {
      // Click outside — cancel confirmation
      this.confirmingNewGame = false;
      return null;
    }
    if (this.confirmingNewGame) {
      this.confirmingNewGame = false;
      return 'newGame';
    }
    this.confirmingNewGame = true;
    return null;
  }

  // --------------------------------------------------------------------------
  // Menu button (top-right, under age name)
  // --------------------------------------------------------------------------

  private drawMenuButton(ctx: CanvasRenderingContext2D, canvasWidth: number): void {
    // Position inside the top bar, aligned with right-side tabs (tab bar is ~24px from right edge)
    const btnX = canvasWidth - MENU_BTN_W - 26;
    const btnY = (TOP_BAR_HEIGHT - MENU_BTN_H) / 2;
    this.menuBtnBounds = { x: btnX, y: btnY, w: MENU_BTN_W, h: MENU_BTN_H };

    ctx.fillStyle = this.confirmingNewGame ? 'rgba(180, 60, 40, 0.85)' : 'rgba(58, 42, 26, 0.80)';
    ctx.fillRect(btnX, btnY, MENU_BTN_W, MENU_BTN_H);

    ctx.strokeStyle = this.confirmingNewGame ? '#E04040' : COLORS.ui.panelBorder;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(btnX + 0.25, btnY + 0.25, MENU_BTN_W - 0.5, MENU_BTN_H - 0.5);

    ctx.fillStyle = this.confirmingNewGame ? '#FFFFFF' : COLORS.ui.textSecondary;
    ctx.font = FONT_TINY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(this.confirmingNewGame ? 'Confirm?' : 'New Game', btnX + MENU_BTN_W / 2, btnY + MENU_BTN_H / 2);
    ctx.textAlign = 'left';
  }

  // --------------------------------------------------------------------------
  // Top resource bar
  // --------------------------------------------------------------------------

  private drawTopBar(ctx: CanvasRenderingContext2D, state: GameState, canvasWidth: number): void {
    // Background with subtle gradient effect
    ctx.fillStyle = 'rgba(42, 32, 18, 0.92)';
    ctx.fillRect(0, 0, canvasWidth, TOP_BAR_HEIGHT);

    // Bottom gold line
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(0, TOP_BAR_HEIGHT - 1, canvasWidth, 1);

    // Subtle top highlight
    ctx.fillStyle = 'rgba(200, 160, 80, 0.1)';
    ctx.fillRect(0, 0, canvasWidth, 1);

    let xCursor = PADDING_X;

    for (const key of RESOURCE_ORDER) {
      this.drawResourceColumn(ctx, state, key, xCursor);
      xCursor += COLUMN_WIDTH;
    }

    this.drawPopulation(ctx, state, xCursor);
    this.drawAgeName(ctx, state, canvasWidth);
  }

  private drawResourceColumn(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    key: typeof RESOURCE_ORDER[number],
    x: number,
  ): void {
    const cy = TOP_BAR_HEIGHT / 2;

    // Rounded icon with letter
    ctx.fillStyle = RESOURCE_ICON_COLORS[key];
    ctx.beginPath();
    ctx.roundRect(x, cy - ICON_SIZE / 2 - 3, ICON_SIZE, ICON_SIZE, 2);
    ctx.fill();
    // Resource initial inside icon
    const initials: Record<string, string> = { food: 'F', wood: 'W', stone: 'S', gold: 'G' };
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 6px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(initials[key] ?? '', x + ICON_SIZE / 2, cy - 3);
    ctx.textAlign = 'left';

    // Value
    ctx.fillStyle = COLORS.ui.textPrimary;
    ctx.font = FONT_MAIN;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(formatNum(state.resources[key]), x + ICON_SIZE + 4, cy - 3);

    // Rate
    const rate = state.rates[key];
    ctx.fillStyle = rate >= 0 ? COLORS.ui.textGreen : COLORS.ui.textRed;
    ctx.font = FONT_RATE;
    ctx.fillText(formatRate(rate) + '/s', x + ICON_SIZE + 4, cy + 7);
  }

  private drawPopulation(ctx: CanvasRenderingContext2D, state: GameState, x: number): void {
    const cy = TOP_BAR_HEIGHT / 2;

    // Person icon
    ctx.fillStyle = COLORS.units.cloth;
    ctx.beginPath();
    ctx.roundRect(x, cy - ICON_SIZE / 2 - 3, ICON_SIZE, ICON_SIZE, 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ui.textPrimary;
    ctx.font = FONT_MAIN;
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.population}/${state.populationCap}`, x + ICON_SIZE + 4, cy - 1);

    ctx.fillStyle = COLORS.ui.textSecondary;
    ctx.font = FONT_RATE;
    ctx.fillText('Pop', x + ICON_SIZE + 4, cy + 8);
  }

  private drawAgeName(ctx: CanvasRenderingContext2D, state: GameState, canvasWidth: number): void {
    const name = AGE_CONFIGS[state.currentAge]?.name ?? state.currentAge;
    ctx.fillStyle = COLORS.ui.textGold;
    ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    // Position left of the New Game button (button starts at canvasWidth - 62)
    ctx.fillText(name, canvasWidth - MENU_BTN_W - 32, TOP_BAR_HEIGHT / 2);
    ctx.textAlign = 'left';
  }

  // --------------------------------------------------------------------------
  // Age advancement panel
  // --------------------------------------------------------------------------

  private drawAgePanel(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
    overrideX?: number,
    overrideY?: number,
  ): void {
    const currentIndex = AGE_ORDER.indexOf(state.currentAge);
    if (currentIndex < 0 || currentIndex >= AGE_ORDER.length - 1) {
      this.lastButtonBounds = null;
      this.lastCanAllAdvance = false;
      return;
    }

    const nextAgeId = AGE_ORDER[currentIndex + 1];
    const nextAge = AGE_CONFIGS[nextAgeId];
    const reqs = nextAge.advanceRequirements;
    const cost = nextAge.advanceCost;

    interface Req { label: string; met: boolean; }
    const requirements: Req[] = [];

    if (cost.food > 0) requirements.push({ label: `${formatNum(cost.food)} Food`, met: state.resources.food >= cost.food });
    if (cost.wood > 0) requirements.push({ label: `${formatNum(cost.wood)} Wood`, met: state.resources.wood >= cost.wood });
    if (cost.stone > 0) requirements.push({ label: `${formatNum(cost.stone)} Stone`, met: state.resources.stone >= cost.stone });
    if (cost.gold > 0) requirements.push({ label: `${formatNum(cost.gold)} Gold`, met: state.resources.gold >= cost.gold });

    if (reqs.minVillagers > 0) {
      const villagers = state.units.filter(u => u.type === 'villager').length;
      requirements.push({ label: `${reqs.minVillagers} Villagers`, met: villagers >= reqs.minVillagers });
    }

    for (const bType of reqs.requiredBuildings) {
      const built = state.buildings.some(b => b.type === bType && b.constructionProgress >= 1);
      requirements.push({ label: BUILDING_LABELS[bType] ?? bType, met: built });
    }

    const canAdvance = requirements.every(r => r.met);
    this.lastCanAllAdvance = canAdvance;

    const numReqs = requirements.length;
    const panelH = AGE_PANEL_PAD + AGE_BTN_H + AGE_PANEL_PAD + numReqs * REQ_LINE_H + AGE_PANEL_PAD;
    const panelX = overrideX ?? (canvasWidth - AGE_PANEL_W - AGE_PANEL_MARGIN);
    const panelY = overrideY ?? (canvasHeight - panelH - 30); // above villager bar

    // Background
    ctx.fillStyle = 'rgba(42, 32, 18, 0.92)';
    ctx.fillRect(panelX, panelY, AGE_PANEL_W, panelH);

    ctx.strokeStyle = COLORS.ui.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX + 0.5, panelY + 0.5, AGE_PANEL_W - 1, panelH - 1);

    // Button
    const btnX = panelX + AGE_PANEL_PAD;
    const btnY = panelY + AGE_PANEL_PAD;
    const btnW = AGE_PANEL_W - AGE_PANEL_PAD * 2;
    this.lastButtonBounds = { x: btnX, y: btnY, w: btnW, h: AGE_BTN_H };

    if (canAdvance) {
      ctx.fillStyle = '#5A3A0A';
      ctx.fillRect(btnX, btnY, btnW, AGE_BTN_H);
      ctx.strokeStyle = '#FFD040';
      ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, AGE_BTN_H - 1);
    } else {
      ctx.fillStyle = '#302218';
      ctx.fillRect(btnX, btnY, btnW, AGE_BTN_H);
      ctx.strokeStyle = '#605040';
      ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, AGE_BTN_H - 1);
    }

    ctx.fillStyle = canAdvance ? COLORS.ui.textGold : COLORS.ui.textSecondary;
    ctx.font = FONT_SMALL;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(`Advance: ${nextAge.name}`, btnX + btnW / 2, btnY + AGE_BTN_H / 2);
    ctx.textAlign = 'left';

    // Requirements checklist
    let reqY = btnY + AGE_BTN_H + AGE_PANEL_PAD;
    for (const req of requirements) {
      const mark = req.met ? '\u2713' : '\u2717';
      const color = req.met ? COLORS.ui.textGreen : COLORS.ui.textRed;
      ctx.fillStyle = color;
      ctx.font = FONT_SMALL;
      ctx.textBaseline = 'top';
      ctx.fillText(mark, btnX, reqY);
      ctx.font = FONT_TINY;
      ctx.fillText(req.label, btnX + 10, reqY + 1);
      reqY += REQ_LINE_H;
    }
    ctx.textBaseline = 'alphabetic';
  }

  // --------------------------------------------------------------------------
  // FPS counter
  // --------------------------------------------------------------------------

  private drawFpsCounter(ctx: CanvasRenderingContext2D, fps: number, canvasHeight: number): void {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, canvasHeight - 14, 42, 13);
    ctx.fillStyle = COLORS.ui.textSecondary;
    ctx.font = FONT_TINY;
    ctx.textBaseline = 'middle';
    ctx.fillText(`${fps} fps`, 3, canvasHeight - 7);
  }
}
