// ============================================================
// TinyEmpire — Unit Renderer
// ============================================================
//
// Draws all units procedurally using canvas primitives.
// Each unit type has distinct visual features:
//   - Villagers: tool based on task, carry sack on back
//   - Infantry: helmet, sword/shield
//   - Archers: green tunic, bow
//   - Cavalry: horse + mounted rider
//   - Siege: vehicle shapes with wheels
//   - Priests: white robes
// All units have ground shadows and walking animations.
// ============================================================

import type { Unit } from '../types/index.ts';
import { COLORS } from './colors.ts';
import { getCurrentStyle, getCurrentStyleId, wobble, pencilColor } from './styles.ts';

const HEAD_R = 2;
const BODY_W = 4;
const BODY_H = 6;

const MILITARY_TYPES = new Set([
  'clubman', 'axeman', 'swordsman', 'legion', 'champion',
  'archer', 'crossbowman', 'longbowman', 'skirmisher',
  'scout', 'cavalry', 'knight', 'paladin',
  'priest',
  'batteringRam', 'catapult', 'trebuchet',
  'handCannoneer', 'bombardCannon', 'warElephant',
]);

const CARRY_COLORS: Record<string, string> = {
  food:  COLORS.resources.food,
  wood:  COLORS.resources.wood,
  stone: COLORS.resources.stone,
  gold:  COLORS.resources.gold,
};

function getBobOffset(unit: Unit, tick: number): number {
  if (unit.state === 'moving') return unit.animFrame % 2;
  if (unit.state === 'working') return Math.round(Math.sin(tick * 0.2 + unit.id) * 0.8) > 0 ? 1 : 0;
  return 0;
}

// ---- Ground shadow under unit -----------------------------------------

function drawUnitShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx = 3, ry = 1): void {
  const style = getCurrentStyle();
  ctx.save();
  if (style.buildingShadowStyle === 'glow') {
    // Neon: colored glow under unit
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, rx * 1.3, ry * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---- Pencil sketch stick figure (comic mode) --------------------------

function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  hasCarry: boolean,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;
  ctx.lineWidth = 0.4;

  // Circle head (stroke only)
  ctx.beginPath();
  ctx.arc(wobble(cx), wobble(cy - BODY_H - HEAD_R), HEAD_R, 0, Math.PI * 2);
  ctx.stroke();

  // Body line (vertical)
  ctx.beginPath();
  ctx.moveTo(wobble(cx), cy - BODY_H);
  ctx.lineTo(wobble(cx), cy - 2);
  ctx.stroke();

  // Legs (V shape)
  ctx.beginPath();
  ctx.moveTo(wobble(cx - 2), cy);
  ctx.lineTo(wobble(cx), cy - 2);
  ctx.lineTo(wobble(cx + 2), cy);
  ctx.stroke();

  // Arms (two short lines from mid-body)
  const armY = cy - BODY_H + 2;
  ctx.beginPath();
  ctx.moveTo(wobble(cx - 3), wobble(armY + 2));
  ctx.lineTo(wobble(cx), wobble(armY));
  ctx.lineTo(wobble(cx + 3), wobble(armY + 2));
  ctx.stroke();

  // Carry sack (small circle on back)
  if (hasCarry) {
    ctx.beginPath();
    ctx.arc(wobble(cx - 2), wobble(cy - BODY_H + 1), 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---- Pencil sketch cavalry (comic mode) --------------------------------

function drawStickCavalry(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;
  ctx.lineWidth = 0.4;

  // Horse body (rectangle outline)
  ctx.beginPath();
  ctx.moveTo(wobble(cx - 6), wobble(cy - 5));
  ctx.lineTo(wobble(cx + 4), wobble(cy - 5));
  ctx.lineTo(wobble(cx + 4), wobble(cy - 2));
  ctx.lineTo(wobble(cx - 6), wobble(cy - 2));
  ctx.closePath();
  ctx.stroke();

  // Horse head (triangle)
  ctx.beginPath();
  ctx.moveTo(wobble(cx + 4), wobble(cy - 5));
  ctx.lineTo(wobble(cx + 7), wobble(cy - 7));
  ctx.lineTo(wobble(cx + 7), wobble(cy - 4));
  ctx.closePath();
  ctx.stroke();

  // Horse legs (stick lines)
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 2); ctx.lineTo(cx - 5, cy + 1);
  ctx.moveTo(cx - 3, cy - 2); ctx.lineTo(cx - 3, cy + 1);
  ctx.moveTo(cx + 2, cy - 2); ctx.lineTo(cx + 2, cy + 1);
  ctx.moveTo(cx + 4, cy - 2); ctx.lineTo(cx + 4, cy + 1);
  ctx.stroke();

  // Rider (stick figure on top)
  ctx.beginPath();
  ctx.arc(wobble(cx - 1), wobble(cy - 9), 1.5, 0, Math.PI * 2);
  ctx.stroke();
  // Rider body
  ctx.beginPath();
  ctx.moveTo(wobble(cx - 1), cy - 7.5);
  ctx.lineTo(wobble(cx - 1), cy - 5);
  ctx.stroke();
}

// ---- Pencil sketch siege (comic mode) ----------------------------------

function drawStickSiege(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
): void {
  const pc = pencilColor();
  ctx.strokeStyle = pc;
  ctx.lineWidth = 0.4;

  // Frame rectangle
  ctx.beginPath();
  ctx.moveTo(wobble(cx - 5), wobble(cy - 5));
  ctx.lineTo(wobble(cx + 5), wobble(cy - 5));
  ctx.lineTo(wobble(cx + 5), wobble(cy));
  ctx.lineTo(wobble(cx - 5), wobble(cy));
  ctx.closePath();
  ctx.stroke();

  // Wheels (circles)
  ctx.beginPath();
  ctx.arc(wobble(cx - 4), wobble(cy), 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(wobble(cx + 4), wobble(cy), 2, 0, Math.PI * 2);
  ctx.stroke();

  // Arm
  ctx.beginPath();
  ctx.moveTo(wobble(cx), cy - 5);
  ctx.lineTo(wobble(cx + 3), cy - 10);
  ctx.stroke();
}

// ---- Enhanced humanoid figure -----------------------------------------

function drawHumanoid(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  skinColor: string,
  bodyColor: string,
  facingRight: boolean,
  isWalking: boolean,
  weaponColor?: string,
  shieldColor?: string,
  helmetColor?: string,
): void {
  const dir = facingRight ? 1 : -1;

  drawUnitShadow(ctx, cx, cy);

  // Legs (split when walking)
  ctx.fillStyle = skinColor;
  if (isWalking) {
    ctx.fillRect(cx - 1, cy - 2, 1, 2);
    ctx.fillRect(cx + 0, cy - 3, 1, 3);
  } else {
    ctx.fillRect(cx - 1, cy - 2, 1, 2);
    ctx.fillRect(cx + 0, cy - 2, 1, 2);
  }

  // Body (tunic)
  ctx.fillStyle = bodyColor;
  ctx.fillRect(cx - BODY_W / 2, cy - BODY_H, BODY_W, BODY_H - 2);

  // Belt
  ctx.fillStyle = '#4A3020';
  ctx.fillRect(cx - BODY_W / 2, cy - 3, BODY_W, 1);

  // Arms
  ctx.fillStyle = skinColor;
  ctx.fillRect(cx + dir * 2, cy - BODY_H + 1, 1, 3);
  ctx.fillRect(cx - dir * 2, cy - BODY_H + 1, 1, 3);

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(cx, cy - BODY_H - HEAD_R, HEAD_R, 0, Math.PI * 2);
  ctx.fill();

  // Helmet (top half of head)
  if (helmetColor) {
    ctx.fillStyle = helmetColor;
    ctx.beginPath();
    ctx.arc(cx, cy - BODY_H - HEAD_R, HEAD_R, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - HEAD_R - 1, cy - BODY_H - HEAD_R, HEAD_R * 2 + 2, 1);
  }

  // Eye
  ctx.fillStyle = '#000000';
  ctx.fillRect(cx + dir * 1, cy - BODY_H - HEAD_R - 0.5, 1, 1);

  // Weapon
  if (weaponColor) {
    ctx.strokeStyle = weaponColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cx + dir * 3, cy - BODY_H + 2);
    ctx.lineTo(cx + dir * 4, cy - BODY_H - 5);
    ctx.stroke();
    if (weaponColor === '#C0C0C0') {
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(cx + dir * 4 - 0.5, cy - BODY_H - 6, 1.5, 2);
    }
  }

  // Shield
  if (shieldColor) {
    ctx.fillStyle = shieldColor;
    ctx.fillRect(cx - dir * 3, cy - BODY_H + 1, 2, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(cx - dir * 3, cy - BODY_H + 1, 1, 1);
  }
}

// ---- Cavalry (horse + rider) ------------------------------------------

function drawCavalry(
  ctx: CanvasRenderingContext2D,
  unit: Unit, cx: number, cy: number,
  bodyColor: string,
): void {
  const dir = unit.facingRight ? 1 : -1;
  const bob = unit.state === 'moving' ? (unit.animFrame % 2) : 0;

  drawUnitShadow(ctx, cx, cy, 5, 2);

  // Horse body
  ctx.fillStyle = '#8B6B3A';
  ctx.fillRect(cx - 5, cy - 5 - bob, 10, 4);
  // Horse head
  ctx.fillRect(cx + 4 * dir, cy - 7 - bob, 3, 3);
  // Horse legs
  ctx.fillStyle = '#6B4E2A';
  const legOff = unit.state === 'moving' ? (unit.animFrame % 2) * 2 - 1 : 0;
  ctx.fillRect(cx - 4, cy - 1 - bob + legOff, 1, 2);
  ctx.fillRect(cx - 2, cy - 1 - bob - legOff, 1, 2);
  ctx.fillRect(cx + 2, cy - 1 - bob + legOff, 1, 2);
  ctx.fillRect(cx + 4, cy - 1 - bob - legOff, 1, 2);

  // Rider
  ctx.fillStyle = bodyColor;
  ctx.fillRect(cx - 1, cy - 9 - bob, 3, 4);
  ctx.fillStyle = COLORS.units.skin;
  ctx.beginPath();
  ctx.arc(cx + 0.5, cy - 11 - bob, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Lance
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + dir * 2, cy - 9 - bob);
  ctx.lineTo(cx + dir * 4, cy - 15 - bob);
  ctx.stroke();

}

// ---- Siege vehicle ----------------------------------------------------

function drawSiege(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number): void {
  drawUnitShadow(ctx, cx, cy, 5, 2);

  if (unit.type === 'catapult' || unit.type === 'trebuchet') {
    // Frame
    ctx.fillStyle = '#7A6040';
    ctx.fillRect(cx - 5, cy - 5, 10, 5);
    // Arm
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.lineTo(cx + (unit.facingRight ? 3 : -3), cy - 11);
    ctx.stroke();
    // Wheels
    ctx.fillStyle = '#503820';
    ctx.beginPath(); ctx.arc(cx - 4, cy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy, 2, 0, Math.PI * 2); ctx.fill();
  } else if (unit.type === 'batteringRam') {
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(cx - 6, cy - 3, 12, 3);
    // Ram head
    ctx.fillStyle = '#808080';
    const dir = unit.facingRight ? 1 : -1;
    ctx.fillRect(cx + dir * 6, cy - 4, 2, 3);
    ctx.fillStyle = '#503820';
    ctx.beginPath(); ctx.arc(cx - 4, cy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy, 2, 0, Math.PI * 2); ctx.fill();
  } else {
    // Bombard cannon
    ctx.fillStyle = '#404040';
    ctx.fillRect(cx - 6, cy - 4, 12, 3);
    const dir = unit.facingRight ? 1 : -1;
    ctx.fillRect(cx + dir * 5, cy - 5, 4, 2);
    ctx.fillStyle = '#503820';
    ctx.beginPath(); ctx.arc(cx - 3, cy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 3, cy, 2, 0, Math.PI * 2); ctx.fill();
  }
}

// ---- War elephant -----------------------------------------------------

function drawElephant(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number): void {
  drawUnitShadow(ctx, cx, cy, 6, 2.5);
  const dir = unit.facingRight ? 1 : -1;

  // Body
  ctx.fillStyle = '#808070';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 5, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = '#707060';
  ctx.fillRect(cx - 5, cy - 1, 2, 3);
  ctx.fillRect(cx - 2, cy - 1, 2, 3);
  ctx.fillRect(cx + 1, cy - 1, 2, 3);
  ctx.fillRect(cx + 4, cy - 1, 2, 3);
  // Head
  ctx.fillStyle = '#808070';
  ctx.beginPath();
  ctx.arc(cx + dir * 7, cy - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  // Trunk
  ctx.strokeStyle = '#707060';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + dir * 9, cy - 5);
  ctx.lineTo(cx + dir * 10, cy - 2);
  ctx.stroke();
  // Tusks
  ctx.fillStyle = '#F0E8D0';
  ctx.fillRect(cx + dir * 8, cy - 5, 1, 2);
  // Rider
  ctx.fillStyle = COLORS.units.playerBlue;
  ctx.fillRect(cx - 1, cy - 11, 3, 3);
  ctx.fillStyle = COLORS.units.skin;
  ctx.beginPath();
  ctx.arc(cx + 0.5, cy - 13, 1.5, 0, Math.PI * 2);
  ctx.fill();

}

// ====================================================================
// Public class
// ====================================================================

export class UnitRenderer {
  render(ctx: CanvasRenderingContext2D, units: Unit[], tick: number): void {
    const sid = getCurrentStyleId();

    for (const unit of units) {
      const bobY = getBobOffset(unit, tick);
      const cx = Math.round(unit.pos.x);
      const cy = Math.round(unit.pos.y) - bobY;

      ctx.save();

      if (sid === 'comic') {
        // Pencil sketch: all units as stick figures
        this.renderComicUnit(ctx, unit, cx, cy);
      } else if (unit.type === 'villager') {
        this.renderVillager(ctx, unit, cx, cy);
      } else if (MILITARY_TYPES.has(unit.type)) {
        this.renderMilitary(ctx, unit, cx, cy);
      } else {
        drawUnitShadow(ctx, cx, cy);
        ctx.fillStyle = COLORS.units.playerBlue;
        ctx.beginPath();
        ctx.arc(cx, cy - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP bar for injured units
      if (unit.hp < unit.maxHp) {
        const barW = 8;
        const barX = cx - barW / 2;
        const barY = cy - BODY_H - HEAD_R * 2 - 4;
        const ratio = unit.hp / unit.maxHp;
        if (sid === 'comic') {
          // Pencil-style HP bar
          const pc = pencilColor();
          ctx.strokeStyle = pc;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(barX, barY, barW, 1);
          ctx.fillStyle = pc;
          ctx.fillRect(barX, barY, barW * ratio, 1);
        } else {
          ctx.fillStyle = '#300000';
          ctx.fillRect(barX, barY, barW, 1);
          ctx.fillStyle = ratio > 0.5 ? COLORS.ui.textGreen : COLORS.ui.textRed;
          ctx.fillRect(barX, barY, barW * ratio, 1);
        }
      }

      ctx.restore();
    }
  }

  private renderComicUnit(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number): void {
    const isCavalry = unit.type === 'scout' || unit.type === 'cavalry' ||
                      unit.type === 'knight' || unit.type === 'paladin';
    const isSiege = unit.type === 'batteringRam' || unit.type === 'catapult' ||
                    unit.type === 'trebuchet' || unit.type === 'bombardCannon';

    if (isCavalry) {
      drawStickCavalry(ctx, cx, cy);
    } else if (isSiege) {
      drawStickSiege(ctx, cx, cy);
    } else if (unit.type === 'warElephant') {
      // Elephant as large oval + stick rider
      const pc = pencilColor();
      ctx.strokeStyle = pc;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.ellipse(wobble(cx), wobble(cy - 5), 7, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Legs
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 1); ctx.lineTo(cx - 4, cy + 2);
      ctx.moveTo(cx - 1, cy - 1); ctx.lineTo(cx - 1, cy + 2);
      ctx.moveTo(cx + 2, cy - 1); ctx.lineTo(cx + 2, cy + 2);
      ctx.moveTo(cx + 5, cy - 1); ctx.lineTo(cx + 5, cy + 2);
      ctx.stroke();
      // Rider stick figure on top
      ctx.beginPath();
      ctx.arc(wobble(cx), wobble(cy - 12), 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(wobble(cx), cy - 10.5);
      ctx.lineTo(wobble(cx), cy - 8);
      ctx.stroke();
    } else {
      // All humanoids: stick figure
      const hasCarry = unit.type === 'villager' && !!unit.carryType && unit.carryAmount > 0;
      drawStickFigure(ctx, cx, cy, hasCarry);
    }
  }

  private renderVillager(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number): void {
    const isWalking = unit.state === 'moving';
    let toolColor: string | undefined;
    if (unit.state === 'working' && unit.carryType === 'wood') toolColor = '#8B5E3C';
    else if (unit.state === 'working' && unit.carryType === 'stone') toolColor = '#808080';
    else if (unit.state === 'working' && unit.carryType === 'gold') toolColor = '#808080';
    else if (unit.state === 'working' && unit.carryType === 'food') toolColor = '#8B5E3C';

    drawHumanoid(ctx, cx, cy, COLORS.units.skin, COLORS.units.cloth, unit.facingRight, isWalking, toolColor);

    // Carry sack on back
    if (unit.carryType && unit.carryAmount > 0) {
      const dir = unit.facingRight ? -1 : 1;
      const dotColor = CARRY_COLORS[unit.carryType] ?? '#FFFFFF';
      ctx.fillStyle = dotColor;
      ctx.fillRect(cx + dir * 3 - 1, cy - BODY_H, 3, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(cx + dir * 3 - 1, cy - BODY_H, 1, 1);
    }
  }

  private renderMilitary(ctx: CanvasRenderingContext2D, unit: Unit, cx: number, cy: number): void {
    const isWalking = unit.state === 'moving';

    const teamColor = unit.owner === 'enemy' ? COLORS.units.enemyRed as string : COLORS.units.playerBlue as string;

    // Siege vehicles
    if (unit.type === 'batteringRam' || unit.type === 'catapult' ||
        unit.type === 'trebuchet' || unit.type === 'bombardCannon') {
      drawSiege(ctx, unit, cx, cy);
      return;
    }

    // War elephant
    if (unit.type === 'warElephant') {
      drawElephant(ctx, unit, cx, cy);
      return;
    }

    // Cavalry (mounted)
    if (unit.type === 'scout' || unit.type === 'cavalry' ||
        unit.type === 'knight' || unit.type === 'paladin') {
      drawCavalry(ctx, unit, cx, cy, teamColor);
      return;
    }
    let weaponColor: string = '#C0C0C0';
    let shieldColor: string | undefined = teamColor;
    let bodyColor: string = teamColor;
    let helmetColor: string | undefined;

    if (unit.type === 'archer' || unit.type === 'crossbowman' ||
        unit.type === 'longbowman' || unit.type === 'skirmisher') {
      weaponColor = '#A07040';
      shieldColor = undefined;
      bodyColor = '#507828';
    } else if (unit.type === 'handCannoneer') {
      weaponColor = '#404040';
      shieldColor = undefined;
      bodyColor = '#605040';
    } else if (unit.type === 'priest') {
      bodyColor = '#F0E8D0';
      weaponColor = '';
      shieldColor = undefined;
    } else if (unit.type === 'swordsman' || unit.type === 'legion') {
      helmetColor = '#C0C0C0';
    } else if (unit.type === 'champion') {
      helmetColor = COLORS.resources.gold;
    }

    drawHumanoid(ctx, cx, cy, COLORS.units.skin, bodyColor, unit.facingRight, isWalking,
      weaponColor || undefined, shieldColor, helmetColor);
  }
}
