// ============================================================
// TinyEmpire — Selected Building / Unit Info Panel
// ============================================================
//
// Shows info about the selected building or unit in the
// bottom-left corner (above the villager bar).
// Supports "Train Unit" buttons for military buildings and
// basic unit info display.
// ============================================================

import type { GameState, Building, Unit, UnitType } from '../types/index.ts';
import { COLORS } from '../render/colors.ts';
import { UnitSystem } from '../systems/unit-system.ts';
import { BuildingSystem } from '../systems/building-system.ts';
import { VILLAGER_BAR_HEIGHT } from './villager-bar.ts';

// Panel geometry
const PANEL_W = 160;
const PANEL_H = 120;
const PANEL_PAD = 5;
const PANEL_MARGIN = 4;

// Which unit types each military building can train
const TRAINABLE_UNITS: Partial<Record<string, UnitType[]>> = {
  townCenter:    ['villager'],
  barracks:      ['clubman', 'axeman', 'swordsman'],
  archeryRange:  ['archer', 'crossbowman', 'skirmisher'],
  stable:        ['scout', 'cavalry', 'knight'],
  siegeWorkshop: ['batteringRam', 'catapult'],
  castle:        ['knight', 'paladin', 'champion'],
  cannonFoundry: ['handCannoneer', 'bombardCannon'],
  temple:        ['priest'],
};

// Inline unit cost lookup (mirrors unit-system.ts — kept minimal)
const UNIT_COSTS: Partial<Record<UnitType, { food: number; wood: number; stone: number; gold: number }>> = {
  villager:      { food: 50,  wood: 0,   stone: 0,   gold: 0   },
  clubman:       { food: 50,  wood: 0,   stone: 0,   gold: 0   },
  axeman:        { food: 60,  wood: 0,   stone: 0,   gold: 0   },
  swordsman:     { food: 80,  wood: 0,   stone: 0,   gold: 0   },
  archer:        { food: 40,  wood: 20,  stone: 0,   gold: 0   },
  crossbowman:   { food: 60,  wood: 30,  stone: 0,   gold: 0   },
  skirmisher:    { food: 60,  wood: 30,  stone: 0,   gold: 0   },
  scout:         { food: 60,  wood: 0,   stone: 0,   gold: 0   },
  cavalry:       { food: 80,  wood: 0,   stone: 0,   gold: 20  },
  knight:        { food: 100, wood: 0,   stone: 0,   gold: 50  },
  paladin:       { food: 120, wood: 0,   stone: 0,   gold: 70  },
  champion:      { food: 120, wood: 0,   stone: 0,   gold: 40  },
  batteringRam:  { food: 0,   wood: 200, stone: 0,   gold: 0   },
  catapult:      { food: 0,   wood: 150, stone: 100, gold: 0   },
  handCannoneer: { food: 80,  wood: 0,   stone: 0,   gold: 80  },
  bombardCannon: { food: 0,   wood: 100, stone: 0,   gold: 200 },
  priest:        { food: 60,  wood: 0,   stone: 0,   gold: 50  },
};

interface TrainButton {
  x: number;
  y: number;
  w: number;
  h: number;
  unitType: UnitType;
}

export class InfoPanel {
  private selectedBuilding: Building | null = null;
  selectedUnit: Unit | null = null; // public for tooltip access
  private trainButtons: TrainButton[] = [];

  setSelectedBuilding(building: Building | null): void {
    this.selectedBuilding = building;
    if (building !== null) this.selectedUnit = null;
  }

  setSelectedUnit(unit: Unit | null): void {
    this.selectedUnit = unit;
    if (unit !== null) this.selectedBuilding = null;
  }

  clearSelection(): void {
    this.selectedBuilding = null;
    this.selectedUnit = null;
  }

  render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    _canvasWidth: number,
    canvasHeight: number,
  ): void {
    this.trainButtons = [];

    if (this.selectedBuilding === null) return; // Units use floating tooltip

    // Sync selected building with current state
    const live = state.buildings.find(b => b.id === this.selectedBuilding!.id);
    if (!live) { this.selectedBuilding = null; return; }
    this.selectedBuilding = live;

    // Calculate dynamic panel height based on content
    let dynH = PANEL_H;
    const trainable = TRAINABLE_UNITS[this.selectedBuilding.type];
    const queueItems = (state.trainingQueue ?? []).filter(q => q.buildingId === this.selectedBuilding!.id);
    const queueRows = Math.min(queueItems.length, 3);
    if (trainable && trainable.length > 0) {
      dynH = Math.max(PANEL_H, 50 + trainable.length * 20 + 10 + (queueRows > 0 ? queueRows * 14 + 18 : 0));
    }

    const panelX = PANEL_MARGIN;
    const panelY = canvasHeight - VILLAGER_BAR_HEIGHT - dynH - PANEL_MARGIN;

    this.drawPanelBackground(ctx, panelX, panelY, PANEL_W, dynH);
    this.drawBuildingInfo(ctx, state, this.selectedBuilding, panelX, panelY);
  }

  handleClick(
    x: number,
    y: number,
    state: GameState,
    unitSystem: UnitSystem,
    _buildingSystem: BuildingSystem,
  ): boolean {
    if (this.selectedBuilding === null) return false;

    let dynH = PANEL_H;
    if (this.selectedBuilding !== null) {
      const trainable = TRAINABLE_UNITS[this.selectedBuilding.type];
      const queueItems = (state.trainingQueue ?? []).filter(q => q.buildingId === this.selectedBuilding!.id);
      const queueRows = Math.min(queueItems.length, 3);
      if (trainable && trainable.length > 0) {
        dynH = Math.max(PANEL_H, 50 + trainable.length * 20 + 10 + (queueRows > 0 ? queueRows * 14 + 18 : 0));
      }
    }

    const panelX = PANEL_MARGIN;
    const panelY = 270 - VILLAGER_BAR_HEIGHT - dynH - PANEL_MARGIN;

    // Is click inside panel?
    if (x < panelX || x > panelX + PANEL_W || y < panelY || y > panelY + dynH) {
      return false;
    }

    // Check train buttons
    for (const btn of this.trainButtons) {
      if (
        x >= btn.x && x <= btn.x + btn.w &&
        y >= btn.y && y <= btn.y + btn.h
      ) {
        unitSystem.trainUnit(state, btn.unitType);
        return true;
      }
    }

    return true; // click consumed by panel even if no button hit
  }

  // --------------------------------------------------------------------------
  // Panel background
  // --------------------------------------------------------------------------

  private drawPanelBackground(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void {
    ctx.fillStyle = 'rgba(58, 42, 26, 0.92)';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = COLORS.ui.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  // --------------------------------------------------------------------------
  // Building info
  // --------------------------------------------------------------------------

  private drawBuildingInfo(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    building: Building,
    px: number,
    py: number,
  ): void {
    const tx = px + PANEL_PAD;
    let ty = py + PANEL_PAD + 7;

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Name
    ctx.font = 'bold 8px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = COLORS.ui.textGold;
    ctx.fillText(this.formatBuildingName(building.type), tx, ty);
    ty += 9;

    // Level & HP
    ctx.font = '7px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = COLORS.ui.textSecondary;
    ctx.fillText(`Lv ${building.level}  HP ${building.hp}/${building.maxHp}`, tx, ty);
    ty += 8;

    // Construction progress
    if (building.constructionProgress < 1) {
      const pct = Math.floor(building.constructionProgress * 100);
      ctx.fillStyle = COLORS.ui.textRed;
      ctx.fillText(`Building... ${pct}%`, tx, ty);
      ty += 8;
      return;
    }

    // HP bar
    const barW = PANEL_W - PANEL_PAD * 2;
    const hpRatio = building.hp / building.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(tx, ty, barW, 3);
    ctx.fillStyle = hpRatio > 0.5 ? COLORS.ui.textGreen : COLORS.ui.textRed;
    ctx.fillRect(tx, ty, barW * hpRatio, 3);
    ty += 7;

    // Train unit buttons (if applicable)
    const trainable = TRAINABLE_UNITS[building.type];
    if (trainable && trainable.length > 0) {
      ctx.font = '7px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = COLORS.ui.textSecondary;
      ctx.fillText('Train:', tx, ty);
      ty += 9;

      const btnW = PANEL_W - PANEL_PAD * 2;
      const btnH = 18;
      const gapY = 2;

      for (const unitType of trainable) {
        const cost = UNIT_COSTS[unitType];
        const canAfford = cost
          ? state.resources.food >= cost.food &&
            state.resources.wood >= cost.wood &&
            state.resources.stone >= cost.stone &&
            state.resources.gold >= cost.gold
          : false;
        const queuedPop = (state.trainingQueue ?? []).length;
        const atCap = state.population + queuedPop >= state.populationCap;
        const enabled = canAfford && !atCap;

        this.drawTrainButton(ctx, tx, ty, btnW, btnH, unitType, cost, enabled, state);
        this.trainButtons.push({ x: tx, y: ty, w: btnW, h: btnH, unitType });
        ty += btnH + gapY;
      }
    }

    // Training queue display
    const queueItems = (state.trainingQueue ?? []).filter(q => q.buildingId === building.id);
    if (queueItems.length > 0) {
      ty += 2;
      ctx.font = '7px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = COLORS.ui.textSecondary;
      ctx.fillText(`Queue (${queueItems.length}):`, tx, ty);
      ty += 9;

      const barW = PANEL_W - PANEL_PAD * 2;
      const maxShow = Math.min(queueItems.length, 3);
      for (let i = 0; i < maxShow; i++) {
        const qi = queueItems[i];
        const name = this.formatUnitName(qi.unitType);
        const pct = Math.floor(qi.progress * 100);

        // Name and percentage
        ctx.font = '6px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = i === 0 ? COLORS.ui.textGold : COLORS.ui.textSecondary;
        ctx.fillText(`${name} ${pct}%`, tx, ty);

        // Progress bar
        const progBarY = ty + 8;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(tx, progBarY, barW, 3);
        ctx.fillStyle = i === 0 ? '#C8A050' : '#706040';
        ctx.fillRect(tx, progBarY, barW * qi.progress, 3);
        ty += 14;
      }
    }
  }

  private drawTrainButton(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    unitType: UnitType,
    cost: { food: number; wood: number; stone: number; gold: number } | undefined,
    enabled: boolean,
    state: GameState,
  ): void {
    // Background
    ctx.fillStyle = enabled
      ? 'rgba(80, 60, 30, 0.85)'
      : 'rgba(40, 30, 20, 0.6)';
    ctx.fillRect(x, y, w, h);

    // Border
    ctx.strokeStyle = enabled ? COLORS.ui.panelBorder : 'rgba(100, 80, 40, 0.4)';
    ctx.lineWidth = 0.75;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // Unit name (full, top line)
    ctx.font = 'bold 7px "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillStyle = enabled ? COLORS.ui.textPrimary : COLORS.ui.textSecondary;
    ctx.fillText(this.formatUnitName(unitType), x + 3, y + 2);

    // Cost icons (bottom line, colored per resource)
    if (cost) {
      let cx = x + 3;
      const costY = y + 10;
      const iconSize = 4;
      const costItems: Array<{ amount: number; color: string; label: string }> = [];
      if (cost.food > 0)  costItems.push({ amount: cost.food, color: COLORS.resources.food, label: `${cost.food}` });
      if (cost.wood > 0)  costItems.push({ amount: cost.wood, color: COLORS.resources.wood, label: `${cost.wood}` });
      if (cost.stone > 0) costItems.push({ amount: cost.stone, color: COLORS.resources.stone, label: `${cost.stone}` });
      if (cost.gold > 0)  costItems.push({ amount: cost.gold, color: COLORS.resources.gold, label: `${cost.gold}` });

      ctx.font = '6px "Segoe UI", Arial, sans-serif';
      for (const item of costItems) {
        // Color dot
        ctx.fillStyle = item.color;
        ctx.fillRect(cx, costY + 1, iconSize, iconSize);
        // Amount number
        const hasEnough = this.hasResource(state, item.color, item.amount);
        ctx.fillStyle = hasEnough ? '#C8A860' : '#E04040';
        ctx.fillText(item.label, cx + iconSize + 2, costY);
        cx += iconSize + ctx.measureText(item.label).width + 6;
      }
    }

    // Pop cap warning (right side)
    if (state.population >= state.populationCap) {
      ctx.fillStyle = '#E04040';
      ctx.font = '6px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('POP MAX', x + w - 3, y + 3);
    }

    ctx.textAlign = 'left';
  }

  private hasResource(state: GameState, color: string, amount: number): boolean {
    if (color === COLORS.resources.food)  return state.resources.food >= amount;
    if (color === COLORS.resources.wood)  return state.resources.wood >= amount;
    if (color === COLORS.resources.stone) return state.resources.stone >= amount;
    if (color === COLORS.resources.gold)  return state.resources.gold >= amount;
    return true;
  }

  // --------------------------------------------------------------------------
  // Formatting helpers
  // --------------------------------------------------------------------------

  private formatBuildingName(type: string): string {
    // camelCase → Title Case with spaces
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

  private formatUnitName(type: string): string {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

}
