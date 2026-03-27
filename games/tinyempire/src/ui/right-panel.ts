// ============================================================
// TinyEmpire — Unified Right-Side Tab Bar
// ============================================================
//
// Manages 4 tabs on the right edge: Build, Army, Map, Age.
// Each tab opens a panel (140px wide) that slides in from the
// right. Only one panel can be open at a time.
// ============================================================

import type { GameState } from '../types/index.ts';
import type { GameCamera } from '../core/camera.ts';
import type { HUD } from './hud.ts';
import type { BuildPanel } from './build-panel.ts';
import type { MilitaryPanel } from './military-panel.ts';
import type { Minimap } from './minimap.ts';
import type { Animal } from '../systems/animal-system.ts';
import type { ProgressionSystem } from '../systems/progression-system.ts';
import { COLORS } from '../render/colors.ts';

export type RightTabId = 'build' | 'army' | 'map' | 'age';

// Layout constants
const TAB_BTN_SIZE = 20;
const TAB_GAP = 3;
const TAB_TOP_Y = 28;  // below the top bar
const PANEL_W = 140;
const PANEL_MARGIN_BOTTOM = 28; // above villager bar

const TAB_DEFS: Array<{ id: RightTabId; label: string }> = [
  { id: 'build', label: 'Build' },
  { id: 'army',  label: 'Army' },
  { id: 'map',   label: 'Map' },
  { id: 'age',   label: 'Age' },
];

export class RightPanel {
  private activeTab: RightTabId | null = null;

  toggle(tab: RightTabId): void {
    if (this.activeTab === tab) {
      this.activeTab = null;
    } else {
      this.activeTab = tab;
    }
  }

  isOpen(tab?: RightTabId): boolean {
    if (tab !== undefined) return this.activeTab === tab;
    return this.activeTab !== null;
  }

  getActiveTab(): RightTabId | null {
    return this.activeTab;
  }

  close(): void {
    this.activeTab = null;
  }

  // ---- Rendering -------------------------------------------------------

  render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    camera: GameCamera,
    hud: HUD,
    buildPanel: BuildPanel,
    militaryPanel: MilitaryPanel,
    minimap: Minimap,
    animals: Animal[],
    canvasWidth: number,
    canvasHeight: number,
    _tick: number,
  ): void {
    const panelOpen = this.activeTab !== null;
    const tabX = panelOpen ? canvasWidth - PANEL_W - TAB_BTN_SIZE - 2 : canvasWidth - TAB_BTN_SIZE;

    // Draw tab buttons
    for (let i = 0; i < TAB_DEFS.length; i++) {
      const tab = TAB_DEFS[i];
      const btnY = TAB_TOP_Y + i * (TAB_BTN_SIZE + TAB_GAP);
      const isActive = this.activeTab === tab.id;

      this.drawTabButton(ctx, tabX, btnY, tab.id, tab.label, isActive);
    }

    // Draw panel content if a tab is active
    if (this.activeTab !== null) {
      const panelX = canvasWidth - PANEL_W;
      const panelTopY = TAB_TOP_Y;
      const panelH = canvasHeight - panelTopY - PANEL_MARGIN_BOTTOM;

      // Panel background
      ctx.fillStyle = 'rgba(35, 25, 15, 0.94)';
      ctx.fillRect(panelX, panelTopY, PANEL_W, panelH);

      // Left border
      ctx.fillStyle = 'rgba(200, 160, 80, 0.6)';
      ctx.fillRect(panelX, panelTopY, 1, panelH);

      // Bottom border
      ctx.strokeStyle = COLORS.ui.panelBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX + 0.5, panelTopY + 0.5, PANEL_W - 1, panelH - 1);

      // Delegate content rendering
      switch (this.activeTab) {
        case 'build':
          buildPanel.renderContent(ctx, state, panelX, panelTopY, PANEL_W, panelH);
          break;
        case 'army':
          militaryPanel.renderContent(ctx, state, panelX, panelTopY, PANEL_W, panelH);
          break;
        case 'map':
          minimap.renderInPanel(ctx, state, camera, animals, panelX, panelTopY, PANEL_W, panelH);
          break;
        case 'age':
          hud.renderAgePanel(ctx, state, canvasWidth, canvasHeight, panelX, panelTopY + 6);
          break;
      }
    }
  }

  // ---- Tab button drawing -----------------------------------------------

  private drawTabButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    id: RightTabId,
    label: string,
    isActive: boolean,
  ): void {
    // Background
    ctx.fillStyle = isActive ? 'rgba(200, 160, 80, 0.25)' : 'rgba(42, 32, 18, 0.9)';
    ctx.beginPath();
    ctx.roundRect(x, y, TAB_BTN_SIZE, TAB_BTN_SIZE, 3);
    ctx.fill();

    // Border
    ctx.strokeStyle = isActive ? '#FFD040' : 'rgba(200, 160, 80, 0.5)';
    ctx.lineWidth = isActive ? 1 : 0.5;
    ctx.beginPath();
    ctx.roundRect(x + 0.5, y + 0.5, TAB_BTN_SIZE - 1, TAB_BTN_SIZE - 1, 3);
    ctx.stroke();

    // Icon
    const cx = x + TAB_BTN_SIZE / 2;
    const cy = y + TAB_BTN_SIZE / 2 - 1;
    const iconColor = isActive ? '#FFD040' : '#C8A050';

    switch (id) {
      case 'build':
        this.drawHammerIcon(ctx, cx, cy, iconColor);
        break;
      case 'army':
        this.drawSwordsIcon(ctx, cx, cy, iconColor);
        break;
      case 'map':
        this.drawGridIcon(ctx, cx, cy, iconColor);
        break;
      case 'age':
        this.drawStarIcon(ctx, cx, cy, iconColor);
        break;
    }

    // Label (tiny, below icon)
    void label; // label not drawn to keep buttons compact at 20px
  }

  private drawHammerIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    ctx.fillRect(-1, -1, 2, 7);  // handle
    ctx.fillRect(-2, -3, 4, 3);  // head
    ctx.restore();
  }

  private drawSwordsIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    // Two crossing diagonal lines
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 4);
    ctx.lineTo(cx + 4, cy + 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 4);
    ctx.lineTo(cx - 4, cy + 4);
    ctx.stroke();
    // Small guards at crossing
    ctx.fillStyle = color;
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  }

  private drawGridIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
    ctx.fillStyle = color;
    // 2x2 grid
    ctx.fillRect(cx - 4, cy - 4, 3, 3);
    ctx.fillRect(cx + 1, cy - 4, 3, 3);
    ctx.fillRect(cx - 4, cy + 1, 3, 3);
    ctx.fillRect(cx + 1, cy + 1, 3, 3);
  }

  private drawStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const outerX = cx + Math.cos(angle) * 5;
      const outerY = cy + Math.sin(angle) * 5;
      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      const innerAngle = angle + Math.PI / 5;
      const innerX = cx + Math.cos(innerAngle) * 2;
      const innerY = cy + Math.sin(innerAngle) * 2;
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ---- Click handling ---------------------------------------------------

  handleClick(
    mouseX: number,
    mouseY: number,
    state: GameState,
    camera: GameCamera,
    canvasWidth: number,
    canvasHeight: number,
    buildPanel: BuildPanel,
    militaryPanel: MilitaryPanel,
    minimap: Minimap,
    hud: HUD,
    progressionSystem: ProgressionSystem,
  ): boolean {
    const panelOpen = this.activeTab !== null;
    const tabX = panelOpen ? canvasWidth - PANEL_W - TAB_BTN_SIZE - 2 : canvasWidth - TAB_BTN_SIZE;

    // Check tab button clicks
    for (let i = 0; i < TAB_DEFS.length; i++) {
      const btnY = TAB_TOP_Y + i * (TAB_BTN_SIZE + TAB_GAP);
      if (
        mouseX >= tabX && mouseX <= tabX + TAB_BTN_SIZE &&
        mouseY >= btnY && mouseY <= btnY + TAB_BTN_SIZE
      ) {
        this.toggle(TAB_DEFS[i].id);
        return true;
      }
    }

    // Check if click is inside the open panel area
    if (panelOpen) {
      const panelX = canvasWidth - PANEL_W;
      const panelTopY = TAB_TOP_Y;
      const panelH = canvasHeight - panelTopY - PANEL_MARGIN_BOTTOM;

      if (
        mouseX >= panelX && mouseX <= panelX + PANEL_W &&
        mouseY >= panelTopY && mouseY <= panelTopY + panelH
      ) {
        // Delegate click to the active panel
        switch (this.activeTab) {
          case 'build':
            return buildPanel.handleContentClick(mouseX, mouseY, state, panelX, panelTopY, PANEL_W, panelH);
          case 'army':
            return militaryPanel.handleContentClick(mouseX, mouseY, state, panelX, panelTopY, PANEL_W, panelH);
          case 'map':
            return minimap.handleClickInPanel(
              mouseX, mouseY, camera,
              state.map.width, state.map.height,
              panelX, panelTopY, PANEL_W, panelH,
            );
          case 'age':
            return hud.handleAgeClick(mouseX, mouseY, state, progressionSystem);
        }
        return true; // consume click in panel area
      }
    }

    return false;
  }
}
