// ============================================================
// TinyEmpire — Villager Assignment Bar
// ============================================================
//
// Compact bottom bar showing villager assignments per resource
// type with +/- buttons to reassign idle villagers.
// All drawing is in screen-space (480×270 virtual resolution).
// ============================================================

import type { GameState, ResourceType } from '../types/index.ts';
import { COLORS } from '../render/colors.ts';
import { UnitSystem } from '../systems/unit-system.ts';
import { getCurrentStyleId, setRenderStyle, type RenderStyle } from '../render/styles.ts';

// Bar geometry
export const VILLAGER_BAR_HEIGHT = 24;
const PADDING_X = 6;
const ICON_SIZE = 8;
const BTN_SIZE = 10;
const SECTION_WIDTH = 70;
const IDLE_SECTION_WIDTH = 52;

const RESOURCE_ORDER: ResourceType[] = ['food', 'wood', 'stone', 'gold'];

const RESOURCE_LABELS: Record<ResourceType, string> = {
  food:  'Food',
  wood:  'Wood',
  stone: 'Stone',
  gold:  'Gold',
};

const RESOURCE_ICON_COLORS: Record<ResourceType, string> = {
  food:  COLORS.resources.food,
  wood:  COLORS.resources.wood,
  stone: COLORS.resources.stone,
  gold:  COLORS.resources.gold,
};

interface HitArea {
  x: number;
  y: number;
  w: number;
  h: number;
  action: 'assign' | 'unassign';
  resource: ResourceType;
}

// Style buttons
const STYLE_BTN_SIZE = 16;
const STYLE_BTN_GAP = 2;
const STYLE_OPTIONS: Array<{ id: RenderStyle; label: string; color: string }> = [
  { id: 'pixel', label: 'PX', color: '#7AC050' },
  { id: 'hd',    label: 'HD', color: '#60A0E0' },
  { id: 'comic', label: 'CM', color: '#FF8040' },
  { id: 'neon',  label: 'NE', color: '#00FFC8' },
];

export class VillagerBar {
  private hitAreas: HitArea[] = [];
  private styleBtnBounds: Array<{ x: number; y: number; w: number; h: number; id: RenderStyle }> = [];

  render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    this.hitAreas = [];

    const barY = canvasHeight - VILLAGER_BAR_HEIGHT;

    // Background
    ctx.fillStyle = 'rgba(58, 42, 26, 0.90)';
    ctx.fillRect(0, barY, canvasWidth, VILLAGER_BAR_HEIGHT);

    // Gold border on top
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(0, barY, canvasWidth, 1);

    // Count villagers by assignment
    const counts = this.countVillagers(state);
    const centerY = barY + VILLAGER_BAR_HEIGHT / 2;

    let x = PADDING_X;

    // -- Idle count -------------------------------------------------------
    this.drawIdleSection(ctx, counts.idle, x, centerY, barY);
    x += IDLE_SECTION_WIDTH;

    // Divider
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(x - 4, barY + 4, 1, VILLAGER_BAR_HEIGHT - 8);

    // -- Resource sections -------------------------------------------------
    for (const resource of RESOURCE_ORDER) {
      const count = counts[resource];
      const canAssign = counts.idle > 0;
      const canUnassign = count > 0;

      this.drawResourceSection(
        ctx, resource, count, x, centerY, barY,
        canAssign, canUnassign,
      );

      x += SECTION_WIDTH;
    }

    // -- Style selector (right side of bar) --------------------------------
    this.styleBtnBounds = [];
    const currentStyleId = getCurrentStyleId();
    const styleTotalW = STYLE_OPTIONS.length * (STYLE_BTN_SIZE + STYLE_BTN_GAP) - STYLE_BTN_GAP;
    let sx = canvasWidth - styleTotalW - 6;

    // Divider
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(sx - 6, barY + 4, 1, VILLAGER_BAR_HEIGHT - 8);

    for (const opt of STYLE_OPTIONS) {
      const sy = barY + (VILLAGER_BAR_HEIGHT - STYLE_BTN_SIZE) / 2;
      const isActive = opt.id === currentStyleId;

      this.styleBtnBounds.push({ x: sx, y: sy, w: STYLE_BTN_SIZE, h: STYLE_BTN_SIZE, id: opt.id });

      // Background
      ctx.fillStyle = isActive ? 'rgba(200, 160, 80, 0.35)' : 'rgba(30, 22, 12, 0.7)';
      ctx.fillRect(sx, sy, STYLE_BTN_SIZE, STYLE_BTN_SIZE);

      // Border
      ctx.strokeStyle = isActive ? opt.color : 'rgba(100, 80, 50, 0.4)';
      ctx.lineWidth = isActive ? 1.5 : 0.5;
      ctx.strokeRect(sx + 0.5, sy + 0.5, STYLE_BTN_SIZE - 1, STYLE_BTN_SIZE - 1);

      // Active bar at bottom
      if (isActive) {
        ctx.fillStyle = opt.color;
        ctx.fillRect(sx + 2, sy + STYLE_BTN_SIZE - 2, STYLE_BTN_SIZE - 4, 1);
      }

      // Label
      ctx.fillStyle = isActive ? opt.color : '#807060';
      ctx.font = 'bold 6px "Segoe UI", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(opt.label, sx + STYLE_BTN_SIZE / 2, sy + STYLE_BTN_SIZE / 2);
      ctx.textAlign = 'left';

      sx += STYLE_BTN_SIZE + STYLE_BTN_GAP;
    }
  }

  // --------------------------------------------------------------------------
  // Drawing helpers
  // --------------------------------------------------------------------------

  private drawIdleSection(
    ctx: CanvasRenderingContext2D,
    idleCount: number,
    x: number,
    centerY: number,
    barY: number,
  ): void {
    // Person icon square (amber)
    ctx.fillStyle = COLORS.units.cloth;
    ctx.fillRect(x, centerY - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);

    ctx.font = '8px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#F0C040'; // amber
    ctx.fillText('Idle', x + ICON_SIZE + 3, centerY - 3);

    ctx.fillStyle = COLORS.ui.textPrimary;
    ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
    ctx.fillText(String(idleCount), x + ICON_SIZE + 3, centerY + 5);

    void barY; // used for layout context
  }

  private drawResourceSection(
    ctx: CanvasRenderingContext2D,
    resource: ResourceType,
    count: number,
    x: number,
    centerY: number,
    barY: number,
    canAssign: boolean,
    canUnassign: boolean,
  ): void {
    // Divider before section
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(x - 4, barY + 4, 1, VILLAGER_BAR_HEIGHT - 8);

    // Colored resource icon with letter
    ctx.fillStyle = RESOURCE_ICON_COLORS[resource];
    ctx.fillRect(x, centerY - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
    const initials: Record<string, string> = { food: 'F', wood: 'W', stone: 'S', gold: 'G' };
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 5px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(initials[resource] ?? '', x + ICON_SIZE / 2, centerY);
    ctx.textAlign = 'left';

    // Label
    ctx.font = '7px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ui.textSecondary;
    ctx.fillText(RESOURCE_LABELS[resource], x + ICON_SIZE + 3, centerY - 4);

    // Count
    ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = COLORS.ui.textPrimary;
    ctx.fillText(String(count), x + ICON_SIZE + 3, centerY + 5);

    // [-] button (left of count area)
    const btnMinusX = x + ICON_SIZE + 24;
    const btnPlusX  = btnMinusX + BTN_SIZE + 2;
    const btnY      = centerY - BTN_SIZE / 2;

    this.drawButton(ctx, btnMinusX, btnY, '-', canUnassign);
    this.drawButton(ctx, btnPlusX,  btnY, '+', canAssign);

    // Register hit areas
    this.hitAreas.push({
      x: btnMinusX, y: btnY, w: BTN_SIZE, h: BTN_SIZE,
      action: 'unassign', resource,
    });
    this.hitAreas.push({
      x: btnPlusX, y: btnY, w: BTN_SIZE, h: BTN_SIZE,
      action: 'assign', resource,
    });
  }

  private drawButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    enabled: boolean,
  ): void {
    // Button background
    ctx.fillStyle = enabled ? 'rgba(200, 160, 80, 0.35)' : 'rgba(80, 60, 40, 0.30)';
    ctx.fillRect(x, y, BTN_SIZE, BTN_SIZE);

    // Button border
    ctx.strokeStyle = enabled ? COLORS.ui.panelBorder : 'rgba(120, 100, 60, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.25, y + 0.25, BTN_SIZE - 0.5, BTN_SIZE - 0.5);

    // Label
    ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = enabled ? COLORS.ui.textGold : COLORS.ui.textSecondary;
    ctx.fillText(label, x + BTN_SIZE / 2, y + BTN_SIZE / 2);
    ctx.textAlign = 'left';
  }

  // --------------------------------------------------------------------------
  // Click handling
  // --------------------------------------------------------------------------

  /**
   * Returns true if the click was inside the villager bar (consumed).
   */
  handleClick(
    x: number,
    y: number,
    state: GameState,
    unitSystem: UnitSystem,
  ): boolean {
    const barY = 270 - VILLAGER_BAR_HEIGHT; // canvasHeight is always 270 virtual
    if (y < barY) return false;

    // Style buttons first (right side)
    for (const sb of this.styleBtnBounds) {
      if (x >= sb.x && x <= sb.x + sb.w && y >= sb.y && y <= sb.y + sb.h) {
        setRenderStyle(sb.id);
        return true;
      }
    }

    for (const area of this.hitAreas) {
      if (
        x >= area.x && x <= area.x + area.w &&
        y >= area.y && y <= area.y + area.h
      ) {
        if (area.action === 'assign') {
          this.assignVillager(state, unitSystem, area.resource);
        } else {
          this.unassignVillager(state, unitSystem, area.resource);
        }
        return true;
      }
    }

    // Click anywhere in the bar — consume it so the map doesn't react
    return true;
  }

  // --------------------------------------------------------------------------
  // Assignment logic
  // --------------------------------------------------------------------------

  private assignVillager(
    state: GameState,
    unitSystem: UnitSystem,
    resource: ResourceType,
  ): void {
    const idle = state.units.find(
      u => u.type === 'villager' && u.carryType === null && u.state === 'idle',
    );
    if (!idle) return;
    unitSystem.assignVillager(idle, null, resource);
  }

  private unassignVillager(
    state: GameState,
    unitSystem: UnitSystem,
    resource: ResourceType,
  ): void {
    const assigned = state.units.find(
      u => u.type === 'villager' && u.carryType === resource,
    );
    if (!assigned) return;
    unitSystem.assignVillager(assigned, null, null);
  }

  // --------------------------------------------------------------------------
  // Utility — count villagers by assignment
  // --------------------------------------------------------------------------

  private countVillagers(state: GameState): Record<ResourceType | 'idle', number> {
    const counts: Record<ResourceType | 'idle', number> = {
      idle: 0,
      food: 0,
      wood: 0,
      stone: 0,
      gold: 0,
    };

    for (const unit of state.units) {
      if (unit.type !== 'villager') continue;

      if (unit.carryType !== null) {
        counts[unit.carryType]++;
      } else {
        counts.idle++;
      }
    }

    return counts;
  }
}
