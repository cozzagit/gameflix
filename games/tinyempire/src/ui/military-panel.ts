// ============================================================
// TinyEmpire — Military Panel
// ============================================================
//
// Toggleable panel (M key) showing owned military units
// grouped by type, with counts, HP, and total strength.
// ============================================================

import type { GameState, UnitType } from '../types/index.ts';
import { COLORS } from '../render/colors.ts';

const PANEL_W = 150;
const PANEL_PAD = 6;
const ROW_H = 14;
const HEADER_H = 18;

const FONT_HEADER = 'bold 9px "Segoe UI", Arial, sans-serif';
const FONT_ROW = '8px "Segoe UI", Arial, sans-serif';
const FONT_SMALL = '7px "Segoe UI", Arial, sans-serif';

const UNIT_DISPLAY_NAMES: Partial<Record<UnitType, string>> = {
  clubman: 'Clubman',
  axeman: 'Axeman',
  swordsman: 'Swordsman',
  legion: 'Legion',
  champion: 'Champion',
  archer: 'Archer',
  crossbowman: 'Crossbow',
  longbowman: 'Longbow',
  skirmisher: 'Skirmisher',
  scout: 'Scout',
  cavalry: 'Cavalry',
  knight: 'Knight',
  paladin: 'Paladin',
  priest: 'Priest',
  batteringRam: 'Batt. Ram',
  catapult: 'Catapult',
  trebuchet: 'Trebuchet',
  handCannoneer: 'H. Cannon',
  bombardCannon: 'Bombard',
  warElephant: 'War Elephant',
};

const UNIT_COLORS: Partial<Record<UnitType, string>> = {
  clubman: '#3070D0', axeman: '#3070D0', swordsman: '#3070D0',
  legion: '#3070D0', champion: '#FFD040',
  archer: '#507828', crossbowman: '#507828', longbowman: '#507828',
  skirmisher: '#507828',
  scout: '#8B6B3A', cavalry: '#8B6B3A', knight: '#8B6B3A', paladin: '#8B6B3A',
  priest: '#F0E8D0',
  batteringRam: '#7A6040', catapult: '#7A6040', trebuchet: '#7A6040',
  handCannoneer: '#605040', bombardCannon: '#404040',
  warElephant: '#808070',
};

interface UnitGroup {
  type: UnitType;
  count: number;
  hp: number;
  maxHp: number;
  ids: number[];
}

export class MilitaryPanel {
  private _open = false;

  toggle(): void { this._open = !this._open; }
  isOpen(): boolean { return this._open; }

  render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (!this._open) return;

    const groups = this.getGroups(state);
    const totalUnits = groups.reduce((s, g) => s + g.count, 0);
    const totalHp = groups.reduce((s, g) => s + g.hp, 0);
    const totalMaxHp = groups.reduce((s, g) => s + g.maxHp, 0);

    const rows = groups.length;
    const panelH = HEADER_H + rows * ROW_H + 24 + PANEL_PAD * 2;
    const px = canvasWidth / 2 - PANEL_W / 2;
    const py = Math.max(30, (canvasHeight - panelH) / 2);

    // Background
    ctx.fillStyle = 'rgba(35, 25, 15, 0.94)';
    ctx.fillRect(px, py, PANEL_W, panelH);
    ctx.strokeStyle = COLORS.ui.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, PANEL_W - 1, panelH - 1);

    // Header
    let y = py + PANEL_PAD;
    ctx.fillStyle = COLORS.ui.textGold;
    ctx.font = FONT_HEADER;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillText('Military Forces', px + PANEL_W / 2, y);
    y += HEADER_H;

    // Divider
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(px + PANEL_PAD, y - 2, PANEL_W - PANEL_PAD * 2, 1);

    if (groups.length === 0) {
      ctx.fillStyle = COLORS.ui.textSecondary;
      ctx.font = FONT_ROW;
      ctx.fillText('No military units', px + PANEL_W / 2, y + 4);
      ctx.fillStyle = COLORS.ui.textSecondary;
      ctx.font = FONT_SMALL;
      ctx.fillText('Train troops at Barracks', px + PANEL_W / 2, y + 16);
      ctx.textAlign = 'left';
      return;
    }

    // Unit rows
    ctx.textAlign = 'left';
    for (const group of groups) {
      const color = UNIT_COLORS[group.type] ?? '#3070D0';
      const name = UNIT_DISPLAY_NAMES[group.type] ?? group.type;

      // Color dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px + PANEL_PAD + 4, y + ROW_H / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = COLORS.ui.textPrimary;
      ctx.font = FONT_ROW;
      ctx.fillText(name, px + PANEL_PAD + 12, y + 2);

      // Count
      ctx.fillStyle = COLORS.ui.textGold;
      ctx.textAlign = 'right';
      ctx.fillText(`x${group.count}`, px + PANEL_W - PANEL_PAD - 30, y + 2);

      // HP
      const hpRatio = group.maxHp > 0 ? group.hp / group.maxHp : 0;
      ctx.fillStyle = hpRatio > 0.5 ? COLORS.ui.textGreen : COLORS.ui.textRed;
      ctx.font = FONT_SMALL;
      ctx.fillText(`${Math.floor(group.hp)}`, px + PANEL_W - PANEL_PAD, y + 3);

      ctx.textAlign = 'left';
      y += ROW_H;
    }

    // Summary
    y += 4;
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(px + PANEL_PAD, y, PANEL_W - PANEL_PAD * 2, 1);
    y += 4;

    ctx.fillStyle = COLORS.ui.textSecondary;
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'center';
    ctx.fillText(
      `${totalUnits} units | Strength: ${Math.floor(totalHp)}/${Math.floor(totalMaxHp)}`,
      px + PANEL_W / 2,
      y,
    );
    ctx.textAlign = 'left';
  }

  /**
   * Render military panel content into a given rectangle (used by RightPanel).
   */
  renderContent(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    px: number,
    py: number,
    pw: number,
    _ph: number,
  ): void {
    const groups = this.getGroups(state);
    const totalUnits = groups.reduce((s, g) => s + g.count, 0);
    const totalHp = groups.reduce((s, g) => s + g.hp, 0);
    const totalMaxHp = groups.reduce((s, g) => s + g.maxHp, 0);

    // Header
    let y = py + PANEL_PAD;
    ctx.fillStyle = COLORS.ui.textGold;
    ctx.font = FONT_HEADER;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillText('Military Forces', px + pw / 2, y);
    y += HEADER_H;

    // Divider
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(px + PANEL_PAD, y - 2, pw - PANEL_PAD * 2, 1);

    if (groups.length === 0) {
      ctx.fillStyle = COLORS.ui.textSecondary;
      ctx.font = FONT_ROW;
      ctx.fillText('No military units', px + pw / 2, y + 4);
      ctx.fillStyle = COLORS.ui.textSecondary;
      ctx.font = FONT_SMALL;
      ctx.fillText('Train troops at Barracks', px + pw / 2, y + 16);
      ctx.textAlign = 'left';
      return;
    }

    // Unit rows
    ctx.textAlign = 'left';
    for (const group of groups) {
      const color = UNIT_COLORS[group.type] ?? '#3070D0';
      const name = UNIT_DISPLAY_NAMES[group.type] ?? group.type;

      // Color dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px + PANEL_PAD + 4, y + ROW_H / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = COLORS.ui.textPrimary;
      ctx.font = FONT_ROW;
      ctx.fillText(name, px + PANEL_PAD + 12, y + 2);

      // Count
      ctx.fillStyle = COLORS.ui.textGold;
      ctx.textAlign = 'right';
      ctx.fillText(`x${group.count}`, px + pw - PANEL_PAD - 30, y + 2);

      // HP
      const hpRatio = group.maxHp > 0 ? group.hp / group.maxHp : 0;
      ctx.fillStyle = hpRatio > 0.5 ? COLORS.ui.textGreen : COLORS.ui.textRed;
      ctx.font = FONT_SMALL;
      ctx.fillText(`${Math.floor(group.hp)}`, px + pw - PANEL_PAD, y + 3);

      ctx.textAlign = 'left';
      y += ROW_H;
    }

    // Summary
    y += 4;
    ctx.fillStyle = COLORS.ui.panelBorder;
    ctx.fillRect(px + PANEL_PAD, y, pw - PANEL_PAD * 2, 1);
    y += 4;

    ctx.fillStyle = COLORS.ui.textSecondary;
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'center';
    ctx.fillText(
      `${totalUnits} units | Strength: ${Math.floor(totalHp)}/${Math.floor(totalMaxHp)}`,
      px + pw / 2,
      y,
    );
    ctx.textAlign = 'left';
  }

  /**
   * Handle a click inside the military panel content (called by RightPanel).
   */
  handleContentClick(
    x: number, y: number,
    state: GameState,
    px: number, py: number,
    pw: number,
    _ph: number,
  ): boolean {
    void pw;
    const groups = this.getGroups(state);

    // Check if click hits a unit row
    const rowStartY = py + PANEL_PAD + HEADER_H;
    for (let i = 0; i < groups.length; i++) {
      const rowY = rowStartY + i * ROW_H;
      if (y >= rowY && y < rowY + ROW_H && x >= px) {
        state.selectedUnitIds = groups[i].ids;
        state.selectedBuildingId = null;
        return true;
      }
    }

    return true; // consume
  }

  handleClick(
    x: number, y: number,
    state: GameState,
    canvasWidth: number,
    canvasHeight: number,
  ): boolean {
    if (!this._open) return false;

    const groups = this.getGroups(state);
    const rows = groups.length;
    const panelH = HEADER_H + rows * ROW_H + 24 + PANEL_PAD * 2;
    const px = canvasWidth / 2 - PANEL_W / 2;
    const py = Math.max(30, (canvasHeight - panelH) / 2);

    if (x < px || x > px + PANEL_W || y < py || y > py + panelH) {
      this._open = false;
      return false;
    }

    // Check if click hits a unit row → select all of that type
    const rowStartY = py + PANEL_PAD + HEADER_H;
    for (let i = 0; i < groups.length; i++) {
      const rowY = rowStartY + i * ROW_H;
      if (y >= rowY && y < rowY + ROW_H) {
        state.selectedUnitIds = groups[i].ids;
        state.selectedBuildingId = null;
        return true;
      }
    }

    return true;
  }

  private getGroups(state: GameState): UnitGroup[] {
    const map = new Map<UnitType, UnitGroup>();
    for (const unit of state.units) {
      if (unit.owner !== 'player') continue;
      if (unit.type === 'villager') continue;
      let group = map.get(unit.type);
      if (!group) {
        group = { type: unit.type, count: 0, hp: 0, maxHp: 0, ids: [] };
        map.set(unit.type, group);
      }
      group.count++;
      group.hp += unit.hp;
      group.maxHp += unit.maxHp;
      group.ids.push(unit.id);
    }
    return Array.from(map.values());
  }
}
