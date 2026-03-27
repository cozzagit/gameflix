// ============================================================
// TinyEmpire — Build Panel UI
// ============================================================

import type { GameState, BuildingType } from '../types/index.ts';
import { BUILDING_CONFIGS } from '../data/buildings.ts';
import { AGE_CONFIGS, AGE_ORDER } from '../data/ages.ts';

// ---- Layout constants ---------------------------------------------------

const PANEL_WIDTH = 140;
const TOP_BAR_H = 26;  // matches hud.ts
const TAB_HEIGHT = 14;
const BTN_COLS = 1;     // single column for readability
const BTN_W = 130;
const BTN_H = 22;
const BTN_GAP = 2;
const PAD_X = 5;
const PAD_Y = 3;

// Scroll state for building lists that don't fit
let scrollOffset = 0;
const MAX_VISIBLE_HEIGHT = 270 - TOP_BAR_H - 24 - TAB_HEIGHT - PAD_Y * 2;

// Toggle button — positioned BELOW the top bar, left of panel
const TOGGLE_SIZE = 22;
const TOGGLE_MARGIN = 6;

// Fonts
const FONT_TAB = 'bold 7px "Segoe UI", Arial, sans-serif';
// ---- Tabs ---------------------------------------------------------------

type TabId = 'economy' | 'military' | 'defense' | 'special';
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'economy', label: 'Econ' },
  { id: 'military', label: 'Army' },
  { id: 'defense', label: 'Def' },
  { id: 'special', label: 'Tech' },
];

// ---- Building icons: simple shape drawing functions ---------------------

const ICON_COLORS: Partial<Record<BuildingType, { main: string; accent: string }>> = {
  townCenter:    { main: '#D8C098', accent: '#FFD040' },
  house:         { main: '#D8C8A8', accent: '#C87048' },
  farm:          { main: '#58A030', accent: '#7AC050' },
  mill:          { main: '#E8A020', accent: '#D0B080' },
  granary:       { main: '#C8A050', accent: '#E8D8B8' },
  lumberCamp:    { main: '#A07040', accent: '#705828' },
  miningCamp:    { main: '#888078', accent: '#A8A098' },
  lumberYard:    { main: '#8B5E3C', accent: '#A07040' },
  stoneVault:    { main: '#A8A098', accent: '#686058' },
  treasury:      { main: '#FFD040', accent: '#D8B030' },
  market:        { main: '#D06040', accent: '#E8D8B8' },
  bank:          { main: '#FFD040', accent: '#C8A050' },
  barracks:      { main: '#C03030', accent: '#D8C098' },
  archeryRange:  { main: '#D06040', accent: '#A07040' },
  stable:        { main: '#B08030', accent: '#D8C098' },
  siegeWorkshop: { main: '#686058', accent: '#A8A098' },
  cannonFoundry: { main: '#484040', accent: '#707880' },
  watchTower:    { main: '#B8A070', accent: '#C8A050' },
  stoneWall:     { main: '#A8A098', accent: '#686058' },
  gate:          { main: '#888078', accent: '#3A2A1A' },
  bombardTower:  { main: '#484040', accent: '#C03030' },
  outpost:       { main: '#C8B068', accent: '#A07040' },
  blacksmith:    { main: '#707880', accent: '#FFD040' },
  university:    { main: '#3070D0', accent: '#E8D8B8' },
  temple:        { main: '#D0A070', accent: '#FFD040' },
  monastery:     { main: '#9060A0', accent: '#E8D8B8' },
  castle:        { main: '#A09890', accent: '#C8A050' },
  wonder:        { main: '#FFD040', accent: '#F0E8E0' },
  imperialPalace: { main: '#F0E8E0', accent: '#FFD040' },
};

function drawBuildingIcon(
  ctx: CanvasRenderingContext2D,
  type: BuildingType,
  cx: number,
  cy: number,
  size: number,
): void {
  const colors = ICON_COLORS[type] ?? { main: '#B8A070', accent: '#C8A050' };
  const half = size / 2;

  // Draw a mini building shape based on category
  const cfg = BUILDING_CONFIGS[type];
  const cat = cfg?.category ?? 'economy';

  if (type === 'farm') {
    // Green field with crop rows
    ctx.fillStyle = '#705828';
    ctx.fillRect(cx - half, cy - half + 2, size, size - 2);
    ctx.fillStyle = colors.main;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(cx - half + 2, cy - half + 4 + i * 4, size - 4, 2);
    }
  } else if (type === 'stoneWall' || type === 'gate') {
    // Wall segment
    ctx.fillStyle = colors.main;
    ctx.fillRect(cx - half, cy - 2, size, 6);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(cx - half, cy - 4, 3, 4);
    ctx.fillRect(cx - half + 5, cy - 4, 3, 4);
    ctx.fillRect(cx + half - 3, cy - 4, 3, 4);
    if (type === 'gate') {
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(cx - 2, cy - 2, 4, 6);
    }
  } else if (cat === 'military') {
    // Military: building with banner
    ctx.fillStyle = colors.main;
    ctx.fillRect(cx - half + 1, cy - half + 4, size - 2, size - 4);
    // Peaked roof
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy - half);
    ctx.lineTo(cx + half, cy - half + 5);
    ctx.lineTo(cx - half, cy - half + 5);
    ctx.closePath();
    ctx.fill();
    // Flag
    ctx.fillStyle = '#C03030';
    ctx.fillRect(cx + half - 4, cy - half - 2, 1, 6);
    ctx.fillRect(cx + half - 3, cy - half - 2, 4, 3);
  } else if (cat === 'defense') {
    // Tower shape
    ctx.fillStyle = colors.main;
    ctx.fillRect(cx - 3, cy - half + 2, 6, size - 2);
    // Crenellations
    ctx.fillStyle = colors.accent;
    ctx.fillRect(cx - 5, cy - half, 3, 4);
    ctx.fillRect(cx + 2, cy - half, 3, 4);
  } else if (type === 'wonder' || type === 'castle' || type === 'imperialPalace') {
    // Grand building
    ctx.fillStyle = colors.main;
    ctx.fillRect(cx - half + 1, cy - half + 4, size - 2, size - 4);
    // Towers
    ctx.fillRect(cx - half - 1, cy - half, 4, size);
    ctx.fillRect(cx + half - 3, cy - half, 4, size);
    // Gold accent
    ctx.fillStyle = colors.accent;
    ctx.fillRect(cx - 2, cy - half + 1, 4, 3);
  } else {
    // Generic building: box + roof
    ctx.fillStyle = colors.main;
    ctx.fillRect(cx - half + 1, cy - half + 5, size - 2, size - 5);
    // Roof
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy - half);
    ctx.lineTo(cx + half + 1, cy - half + 6);
    ctx.lineTo(cx - half - 1, cy - half + 6);
    ctx.closePath();
    ctx.fill();
    // Door
    ctx.fillStyle = '#3A2A1A';
    ctx.fillRect(cx - 2, cy + half - 5, 4, 5);
  }
}

// ---- Helpers ------------------------------------------------------------

function getUnlockedBuildings(state: GameState): BuildingType[] {
  const currentIndex = AGE_ORDER.indexOf(state.currentAge);
  const result = new Set<BuildingType>();
  for (let i = 0; i <= currentIndex; i++) {
    for (const bt of AGE_CONFIGS[AGE_ORDER[i]].unlockedBuildings) {
      result.add(bt);
    }
  }
  return Array.from(result);
}

// ====================================================================

export class BuildPanel {
  private _open = false;
  private activeTab: TabId = 'economy';
  private selectedBuilding: BuildingType | null = null;

  isOpen(): boolean { return this._open; }
  toggle(): void { this._open = !this._open; }
  getSelectedBuilding(): BuildingType | null { return this.selectedBuilding; }
  clearSelection(): void { this.selectedBuilding = null; }

  // ---- Geometry --------------------------------------------------------

  private panelX(cw: number): number { return cw - PANEL_WIDTH; }
  private panelY(): number { return TOP_BAR_H; }
  private panelH(ch: number): number { return ch - TOP_BAR_H; }

  private toggleBtnRect(_cw: number): { x: number; y: number; w: number; h: number } {
    // Below the top bar, right side, outside the panel
    return {
      x: _cw - PANEL_WIDTH - TOGGLE_SIZE - TOGGLE_MARGIN,
      y: TOP_BAR_H + TOGGLE_MARGIN,
      w: TOGGLE_SIZE,
      h: TOGGLE_SIZE,
    };
  }

  private tabRect(i: number, px: number, py: number): { x: number; y: number; w: number; h: number } {
    const tabW = Math.floor(PANEL_WIDTH / TABS.length);
    return { x: px + i * tabW, y: py, w: tabW, h: TAB_HEIGHT };
  }

  private buttonRect(slot: number, px: number, py: number): { x: number; y: number; w: number; h: number } {
    const col = slot % BTN_COLS;
    const row = Math.floor(slot / BTN_COLS);
    const startX = px + PAD_X;
    const startY = py + TAB_HEIGHT + PAD_Y;
    return {
      x: startX + col * (BTN_W + BTN_GAP),
      y: startY + row * (BTN_H + BTN_GAP),
      w: BTN_W,
      h: BTN_H,
    };
  }

  // ---- Rendering -------------------------------------------------------

  render(ctx: CanvasRenderingContext2D, state: GameState, cw: number, ch: number): void {
    this.drawToggleButton(ctx, cw);
    if (!this._open) return;

    const px = this.panelX(cw);
    const py = this.panelY();
    const ph = this.panelH(ch);

    // Panel background
    ctx.fillStyle = 'rgba(35, 25, 15, 0.94)';
    ctx.fillRect(px, py, PANEL_WIDTH, ph);

    // Left border
    ctx.fillStyle = 'rgba(200, 160, 80, 0.6)';
    ctx.fillRect(px, py, 1, ph);

    this.drawTabs(ctx, px, py);
    this.drawButtons(ctx, state, px, py);
  }

  /**
   * Render just the content (tabs + building buttons) into a given rectangle.
   * Used by the unified RightPanel.
   */
  renderContent(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    px: number,
    py: number,
    _pw: number,
    _ph: number,
  ): void {
    this.drawTabs(ctx, px, py);
    this.drawButtons(ctx, state, px, py);
  }

  private drawToggleButton(ctx: CanvasRenderingContext2D, cw: number): void {
    const r = this.toggleBtnRect(cw);

    // Background
    ctx.fillStyle = this._open ? 'rgba(200, 160, 80, 0.25)' : 'rgba(42, 32, 18, 0.9)';
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 4);
    ctx.fill();

    // Border
    ctx.strokeStyle = this._open ? '#C8A050' : 'rgba(200, 160, 80, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 4);
    ctx.stroke();

    // Hammer icon (simple pixel art style)
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.fillStyle = this._open ? '#FFD040' : '#C8A050';

    // Handle (diagonal line)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    ctx.fillRect(-1, -2, 2, 10); // handle
    ctx.fillRect(-3, -4, 6, 4);  // head
    ctx.restore();
  }

  private drawTabs(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    for (let i = 0; i < TABS.length; i++) {
      const tab = TABS[i];
      const r = this.tabRect(i, px, py);
      const active = tab.id === this.activeTab;

      // Background
      ctx.fillStyle = active ? 'rgba(200, 160, 80, 0.2)' : 'rgba(25, 18, 10, 0.8)';
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Active indicator
      if (active) {
        ctx.fillStyle = '#C8A050';
        ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
      }

      // Separator
      ctx.fillStyle = 'rgba(200, 160, 80, 0.3)';
      ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1);
      if (i > 0) ctx.fillRect(r.x, r.y + 3, 1, r.h - 6);

      // Label
      ctx.fillStyle = active ? '#F0E8D0' : '#908878';
      ctx.font = FONT_TAB;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, r.x + r.w / 2, r.y + r.h / 2 - 1);
      ctx.textAlign = 'left';
    }
  }

  private drawButtons(ctx: CanvasRenderingContext2D, state: GameState, px: number, py: number): void {
    const unlocked = getUnlockedBuildings(state);
    const tabBuildings = unlocked.filter(t => {
      const cfg = BUILDING_CONFIGS[t];
      return cfg && cfg.category === this.activeTab;
    });

    // Clamp scroll offset
    const totalRows = Math.ceil(tabBuildings.length / BTN_COLS);
    const totalContentH = totalRows * (BTN_H + BTN_GAP);
    const maxScroll = Math.max(0, totalContentH - MAX_VISIBLE_HEIGHT);
    scrollOffset = Math.min(scrollOffset, maxScroll);
    scrollOffset = Math.max(0, scrollOffset);

    // Clip region for button area
    const clipY = py + TAB_HEIGHT;
    const clipH = MAX_VISIBLE_HEIGHT;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, clipY, PANEL_WIDTH, clipH);
    ctx.clip();

    for (let i = 0; i < tabBuildings.length; i++) {
      const type = tabBuildings[i];
      const cfg = BUILDING_CONFIGS[type];
      const r = this.buttonRect(i, px, py);
      // Apply scroll
      const scrolledY = r.y - scrollOffset;
      const selected = type === this.selectedBuilding;
      const afford = this.canAfford(state, type);

      // Skip if completely out of clip area
      if (scrolledY + r.h < clipY || scrolledY > clipY + clipH) continue;

      // Button background
      ctx.fillStyle = selected
        ? 'rgba(200, 160, 80, 0.18)'
        : 'rgba(50, 38, 22, 0.85)';
      ctx.beginPath();
      ctx.roundRect(r.x, scrolledY, r.w, r.h, 2);
      ctx.fill();

      // Border
      if (selected) {
        ctx.strokeStyle = '#FFD040';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = afford ? 'rgba(160, 130, 60, 0.5)' : 'rgba(80, 60, 30, 0.3)';
        ctx.lineWidth = 0.75;
      }
      ctx.beginPath();
      ctx.roundRect(r.x + 0.5, scrolledY + 0.5, r.w - 1, r.h - 1, 2);
      ctx.stroke();

      ctx.globalAlpha = afford ? 1.0 : 0.4;

      // Icon (small square, left)
      const iconSize = 14;
      const iconCx = r.x + 10;
      const iconCy = scrolledY + BTN_H / 2;
      drawBuildingIcon(ctx, type, iconCx, iconCy, iconSize);

      // Name (bold, center-left)
      ctx.fillStyle = afford ? '#F0E8D0' : '#908878';
      ctx.font = 'bold 7px "Segoe UI", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(cfg.name, r.x + 20, scrolledY + 8);

      // Cost (smaller, below name)
      ctx.fillStyle = afford ? '#C8A050' : '#705840';
      ctx.font = '6px "Segoe UI", Arial, sans-serif';
      ctx.fillText(this.formatCost(cfg.baseCost), r.x + 20, scrolledY + 17);

      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
    ctx.textAlign = 'left';

    // Scroll buttons if content overflows
    if (maxScroll > 0) {
      const arrowW = PANEL_WIDTH - 4;
      const arrowH = 12;
      if (scrollOffset > 0) {
        const ay = clipY;
        ctx.fillStyle = 'rgba(42, 32, 18, 0.95)';
        ctx.fillRect(px + 2, ay, arrowW, arrowH);
        ctx.fillStyle = '#C8A050';
        ctx.font = 'bold 8px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲  ▲  ▲', px + PANEL_WIDTH / 2, ay + arrowH / 2);
      }
      if (scrollOffset < maxScroll) {
        const ay = clipY + clipH - arrowH;
        ctx.fillStyle = 'rgba(42, 32, 18, 0.95)';
        ctx.fillRect(px + 2, ay, arrowW, arrowH);
        ctx.fillStyle = '#C8A050';
        ctx.font = 'bold 8px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▼  ▼  ▼', px + PANEL_WIDTH / 2, ay + arrowH / 2);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  /** Scroll the building list (called from input handling) */
  scroll(delta: number): void {
    scrollOffset += delta;
  }

  // ---- Click handling ---------------------------------------------------

  handleClick(
    x: number, y: number,
    state: GameState,
    canvasWidth: number,
    _canvasHeight: number,
  ): { action: 'selectBuilding'; type: BuildingType }
   | { action: 'selectTab'; tab: TabId }
   | { action: 'toggle' }
   | null {
    const tr = this.toggleBtnRect(canvasWidth);
    if (x >= tr.x && x <= tr.x + tr.w && y >= tr.y && y <= tr.y + tr.h) {
      return { action: 'toggle' };
    }

    if (!this._open) return null;

    const px = this.panelX(canvasWidth);
    const py = this.panelY();
    if (x < px || x > canvasWidth || y < py) return null;

    // Tabs
    for (let i = 0; i < TABS.length; i++) {
      const r = this.tabRect(i, px, py);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return { action: 'selectTab', tab: TABS[i].id };
      }
    }

    // Building buttons
    const unlocked = getUnlockedBuildings(state);
    const tabBuildings = unlocked.filter(t => {
      const cfg = BUILDING_CONFIGS[t];
      return cfg && cfg.category === this.activeTab;
    });

    for (let i = 0; i < tabBuildings.length; i++) {
      const r = this.buttonRect(i, px, py);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return { action: 'selectBuilding', type: tabBuildings[i] };
      }
    }

    // Inside panel but no button → consume click
    return { action: 'selectTab', tab: this.activeTab };
  }

  /**
   * Handle a click inside the panel content area (called by RightPanel).
   * Returns true if click was consumed, and applies actions directly.
   */
  handleContentClick(
    x: number, y: number,
    state: GameState,
    px: number, py: number,
    _pw: number, _ph: number,
  ): boolean {
    // Tabs
    for (let i = 0; i < TABS.length; i++) {
      const r = this.tabRect(i, px, py);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        this.activeTab = TABS[i].id;
        this.selectedBuilding = null;
        scrollOffset = 0;
        return true;
      }
    }

    // Scroll arrow buttons
    const clipY = py + TAB_HEIGHT;
    const clipH = MAX_VISIBLE_HEIGHT;
    const arrowH = 12;
    const unlocked = getUnlockedBuildings(state);
    const tabBuildings = unlocked.filter(t => {
      const cfg = BUILDING_CONFIGS[t];
      return cfg && cfg.category === this.activeTab;
    });
    const totalRows = Math.ceil(tabBuildings.length / BTN_COLS);
    const totalContentH = totalRows * (BTN_H + BTN_GAP);
    const maxScroll = Math.max(0, totalContentH - MAX_VISIBLE_HEIGHT);

    // Up arrow click
    if (scrollOffset > 0 && y >= clipY && y <= clipY + arrowH && x >= px && x <= px + PANEL_WIDTH) {
      scrollOffset = Math.max(0, scrollOffset - (BTN_H + BTN_GAP) * 2);
      return true;
    }
    // Down arrow click
    if (scrollOffset < maxScroll && y >= clipY + clipH - arrowH && y <= clipY + clipH && x >= px && x <= px + PANEL_WIDTH) {
      scrollOffset = Math.min(maxScroll, scrollOffset + (BTN_H + BTN_GAP) * 2);
      return true;
    }

    // Building buttons (account for scroll)
    for (let i = 0; i < tabBuildings.length; i++) {
      const r = this.buttonRect(i, px, py);
      const scrolledY = r.y - scrollOffset;
      if (x >= r.x && x <= r.x + r.w && y >= scrolledY && y <= scrolledY + r.h) {
        this.selectBuilding(tabBuildings[i]);
        return true;
      }
    }

    return true;
  }

  hitsPanel(x: number, y: number, canvasWidth: number, canvasHeight: number): boolean {
    if (!this._open) {
      const tr = this.toggleBtnRect(canvasWidth);
      return x >= tr.x && x <= tr.x + tr.w && y >= tr.y && y <= tr.y + tr.h;
    }
    const px = this.panelX(canvasWidth);
    const py = this.panelY();
    const ph = this.panelH(canvasHeight);
    return (x >= px && x <= canvasWidth && y >= py && y <= py + ph) ||
      (() => { const tr = this.toggleBtnRect(canvasWidth); return x >= tr.x && x <= tr.x + tr.w && y >= tr.y && y <= tr.y + tr.h; })();
  }

  // ---- Helpers ----------------------------------------------------------

  private canAfford(state: GameState, type: BuildingType): boolean {
    const cfg = BUILDING_CONFIGS[type];
    const r = state.resources;
    return r.food >= cfg.baseCost.food && r.wood >= cfg.baseCost.wood &&
           r.stone >= cfg.baseCost.stone && r.gold >= cfg.baseCost.gold;
  }

  private formatCost(cost: { food: number; wood: number; stone: number; gold: number }): string {
    const parts: string[] = [];
    if (cost.food > 0) parts.push(`${cost.food}F`);
    if (cost.wood > 0) parts.push(`${cost.wood}W`);
    if (cost.stone > 0) parts.push(`${cost.stone}S`);
    if (cost.gold > 0) parts.push(`${cost.gold}G`);
    return parts.slice(0, 2).join(' ') || 'Free';
  }

  selectTab(tab: TabId): void {
    this.activeTab = tab;
    this.selectedBuilding = null;
  }

  selectBuilding(type: BuildingType): void {
    this.selectedBuilding = this.selectedBuilding === type ? null : type;
  }
}
