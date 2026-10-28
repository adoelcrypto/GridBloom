/**
 * GridBloom - Phaser 3 Scene Implementation
 * Handles board rendering, tray pieces, drag-and-drop snapping with touch offsets,
 * visual placement previews, line clear particle bursts, and Bloom Pulse targeting.
 */

import Phaser from 'phaser';
import { GameState, MoveResult, PulseTarget, canPlacePiece, isEligiblePulseTarget } from '../engine/rules';
import { PieceDefinition } from '../pieces/pieceTypes';
import { BOARD_SIZE, BoardCell } from '../engine/board';
import { soundManager } from '../audio/soundManager';

export interface SceneCallbacks {
  onMoveAttempt: (trayPieceId: string, anchorRow: number, anchorCol: number) => void;
  onPulseTargetSelect: (target: PulseTarget) => void;
}

interface DraggedPieceState {
  trayId: string;
  definition: PieceDefinition;
  container: Phaser.GameObjects.Container;
  originX: number;
  originY: number;
  originScale: number;
  grabOffsetX: number;
  grabOffsetY: number;
}

export class GridBloomScene extends Phaser.Scene {
  private callbacks: SceneCallbacks;
  private gameState: GameState | null = null;
  private reducedMotion: boolean = false;

  // Board layout metrics
  private boardX: number = 0;
  private boardY: number = 0;
  private cellSize: number = 42;
  private boardPixelSize: number = 336;

  // Visual containers
  private boardBackgroundGfx!: Phaser.GameObjects.Graphics;
  private gridCellsGfx!: Phaser.GameObjects.Graphics;
  private ghostPreviewGfx!: Phaser.GameObjects.Graphics;
  private pulseTargetGfx!: Phaser.GameObjects.Graphics;
  private trayContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private particleEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Drag state
  private activeDrag: DraggedPieceState | null = null;
  private currentHoverAnchor: { r: number; c: number; valid: boolean } | null = null;

  // Pulse targeting mode
  private pulseHoverTarget: PulseTarget | null = null;

  constructor(callbacks: SceneCallbacks, initialGameState?: GameState) {
    super({ key: 'GridBloomScene' });
    this.callbacks = callbacks;
    if (initialGameState) {
      this.gameState = initialGameState;
    }
  }

  public setCallbacks(callbacks: SceneCallbacks): void {
    this.callbacks = callbacks;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public updateGameState(newState: GameState): void {
    const prevState = this.gameState;
    this.gameState = newState;

    if (!this.scene.isActive()) return;

    this.renderBoard();
    this.renderTray();

    // Check if a move just occurred with cleared rows/columns
    if (newState.lastMoveSummary && newState.lastMoveSummary.success) {
      this.playClearAnimations(newState.lastMoveSummary);
    }

    if (newState.pulseActive) {
      this.renderPulseGuides();
    } else {
      this.pulseTargetGfx.clear();
      this.pulseHoverTarget = null;
    }
  }

  public create(): void {
    // Background graphics
    this.boardBackgroundGfx = this.add.graphics();
    this.gridCellsGfx = this.add.graphics();
    this.ghostPreviewGfx = this.add.graphics();
    this.pulseTargetGfx = this.add.graphics();

    // Setup input listeners
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);

    this.recalculateLayout();

    if (typeof window !== 'undefined') {
      (window as any).__gridBloomScene = this;
    }

    if (this.gameState) {
      this.renderBoard();
      this.renderTray();
    }
  }

  public handleResize(width: number, height: number): void {
    if (!this.scale || !this.scene || !this.scene.isActive()) return;
    this.scale.resize(width, height);
    this.recalculateLayout();
    if (this.gameState) {
      this.renderBoard();
      this.renderTray();
    }
  }

  private recalculateLayout(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    // Board should occupy ~88-92% of screen width on mobile, max 420px
    const maxBoardDim = Math.min(w * 0.90, 420);
    // Board cell size (8x8)
    const padding = 8;
    this.cellSize = Math.floor((maxBoardDim - padding * 2) / BOARD_SIZE);
    this.boardPixelSize = this.cellSize * BOARD_SIZE + padding * 2;

    this.boardX = Math.round((w - this.boardPixelSize) / 2);

    // Board Y positioning: placed comfortably in upper-middle area
    // Tray sits below the board
    const availableTop = Math.max(16, (h - this.boardPixelSize - 160) / 2.4);
    this.boardY = Math.round(Math.min(availableTop, 90));

    // Render board background frame
    this.boardBackgroundGfx.clear();

    // Outer subtle border
    this.boardBackgroundGfx.fillStyle(0x0f172a, 0.9);
    this.boardBackgroundGfx.fillRoundedRect(this.boardX, this.boardY, this.boardPixelSize, this.boardPixelSize, 14);

    this.boardBackgroundGfx.lineStyle(1.5, 0x1e293b, 1);
    this.boardBackgroundGfx.strokeRoundedRect(this.boardX, this.boardY, this.boardPixelSize, this.boardPixelSize, 14);
  }

  private renderBoard(): void {
    if (!this.gameState) return;
    this.gridCellsGfx.clear();

    const padding = 8;
    const innerX = this.boardX + padding;
    const innerY = this.boardY + padding;

    // Draw empty grid sockets and filled blocks
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = innerX + c * this.cellSize;
        const y = innerY + r * this.cellSize;
        const cell = this.gameState.board[r][c];

        if (cell.filled && cell.color) {
          // Draw filled jewel block
          this.drawJewelBlock(this.gridCellsGfx, x, y, this.cellSize, cell.color, cell.glowColor || cell.color);
        } else {
          // Draw empty slot socket
          this.gridCellsGfx.fillStyle(0x131c31, 0.85);
          this.gridCellsGfx.fillRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);

          this.gridCellsGfx.lineStyle(1, 0x1e2d4d, 0.5);
          this.gridCellsGfx.strokeRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);
        }
      }
    }
  }

  private drawJewelBlock(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    size: number,
    colorHex: string,
    glowHex: string,
    alpha: number = 1.0
  ): void {
    const colNum = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const glowNum = Phaser.Display.Color.HexStringToColor(glowHex).color;

    const bX = x + 2;
    const bY = y + 2;
    const bSize = size - 4;
    const radius = Math.max(4, Math.floor(size * 0.16));

    // Base fill
    gfx.fillStyle(colNum, alpha);
    gfx.fillRoundedRect(bX, bY, bSize, bSize, radius);

    // Top-left subtle specular highlight
    gfx.fillStyle(0xffffff, alpha * 0.35);
    gfx.fillRoundedRect(bX + 2, bY + 2, bSize - 4, Math.max(3, bSize * 0.32), radius - 1);

    // Border stroke
    gfx.lineStyle(1.5, glowNum, alpha * 0.85);
    gfx.strokeRoundedRect(bX, bY, bSize, bSize, radius);
  }

  private renderTray(): void {
    if (!this.gameState) return;

    // Clean up old tray piece containers
    this.trayContainers.forEach((container) => container.destroy());
    this.trayContainers.clear();

    const w = this.scale.width;
    const trayY = this.boardY + this.boardPixelSize + 32;
    const slotWidth = Math.floor(this.boardPixelSize / 3);

    this.gameState.tray.forEach((trayPiece, idx) => {
      if (trayPiece.used) return;

      const slotCenterX = this.boardX + idx * slotWidth + slotWidth / 2;
      const slotCenterY = trayY + 45;

      const pieceDef = trayPiece.definition;
      // Calculate scale to fit piece within tray slot
      const maxPieceDim = Math.max(pieceDef.rows, pieceDef.cols);
      const targetTrayPieceSize = 80;
      const naturalPiecePixelSize = maxPieceDim * this.cellSize;
      const trayScale = Math.min(0.68, targetTrayPieceSize / naturalPiecePixelSize);

      const pieceContainer = this.add.container(slotCenterX, slotCenterY);
      pieceContainer.setScale(trayScale);

      // Create graphics for piece blocks
      const pieceGfx = this.add.graphics();
      const halfWidth = (pieceDef.cols * this.cellSize) / 2;
      const halfHeight = (pieceDef.rows * this.cellSize) / 2;

      for (const block of pieceDef.blocks) {
        const bx = block.c * this.cellSize - halfWidth;
        const by = block.r * this.cellSize - halfHeight;
        this.drawJewelBlock(pieceGfx, bx, by, this.cellSize, pieceDef.color, pieceDef.glowColor);
      }
      pieceContainer.add(pieceGfx);

      // Dedicated interactive hit zone for rock-solid pointer/touch detection
      const hitW = Math.max(80, (pieceDef.cols * this.cellSize) / trayScale);
      const hitH = Math.max(80, (pieceDef.rows * this.cellSize) / trayScale);
      const hitZone = this.add.zone(0, 0, hitW, hitH);
      hitZone.setInteractive({ useHandCursor: true });
      pieceContainer.add(hitZone);

      hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.gameState?.isGameOver || this.gameState?.pulseActive) return;
        this.startDrag(trayPiece.id, pieceDef, pieceContainer, slotCenterX, slotCenterY, trayScale, pointer);
      });

      this.trayContainers.set(trayPiece.id, pieceContainer);
    });
  }

  private startDrag(
    trayId: string,
    definition: PieceDefinition,
    container: Phaser.GameObjects.Container,
    originX: number,
    originY: number,
    originScale: number,
    pointer: Phaser.Input.Pointer
  ): void {
    soundManager.playPickup();

    const isTouch = pointer.wasTouch;
    // Mobile touch offset: lift piece by ~68px so player thumb doesn't hide preview!
    const touchYOffset = isTouch ? -68 : 0;

    this.activeDrag = {
      trayId,
      definition,
      container,
      originX,
      originY,
      originScale,
      grabOffsetX: 0,
      grabOffsetY: touchYOffset,
    };

    container.setDepth(100);

    // Scale up to 1:1 board cell scale with smooth tween
    this.tweens.add({
      targets: container,
      scale: 1.0,
      x: pointer.x,
      y: pointer.y + touchYOffset,
      duration: this.reducedMotion ? 0 : 120,
      ease: 'Back.easeOut',
    });
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    // Pulse targeting mode handling
    if (this.gameState?.pulseActive) {
      this.handlePulsePointerMove(pointer);
      return;
    }

    if (!this.activeDrag || !this.gameState) return;

    // Follow pointer with touch offset
    const targetX = pointer.x + this.activeDrag.grabOffsetX;
    const targetY = pointer.y + this.activeDrag.grabOffsetY;

    this.activeDrag.container.x = targetX;
    this.activeDrag.container.y = targetY;

    // Check board snapping
    const padding = 8;
    const innerX = this.boardX + padding;
    const innerY = this.boardY + padding;

    const pieceDef = this.activeDrag.definition;
    const halfWidth = (pieceDef.cols * this.cellSize) / 2;
    const halfHeight = (pieceDef.rows * this.cellSize) / 2;

    // Anchor (0, 0) top-left in screen coords
    const anchorScreenX = targetX - halfWidth;
    const anchorScreenY = targetY - halfHeight;

    // Convert to grid row/col
    const rawCol = Math.round((anchorScreenX - innerX) / this.cellSize);
    const rawRow = Math.round((anchorScreenY - innerY) / this.cellSize);

    const valid = canPlacePiece(this.gameState.board, pieceDef, rawRow, rawCol);

    this.currentHoverAnchor = { r: rawRow, c: rawCol, valid };
    this.renderGhostPreview();
  }

  private renderGhostPreview(): void {
    this.ghostPreviewGfx.clear();
    if (!this.activeDrag || !this.currentHoverAnchor || !this.gameState) return;

    const { r, c, valid } = this.currentHoverAnchor;
    const pieceDef = this.activeDrag.definition;
    const padding = 8;
    const innerX = this.boardX + padding;
    const innerY = this.boardY + padding;

    for (const b of pieceDef.blocks) {
      const targetR = r + b.r;
      const targetC = c + b.c;

      if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
        const x = innerX + targetC * this.cellSize;
        const y = innerY + targetR * this.cellSize;

        if (valid) {
          // Luminous cyan ghost block
          this.ghostPreviewGfx.fillStyle(0x06b6d4, 0.45);
          this.ghostPreviewGfx.fillRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);
          this.ghostPreviewGfx.lineStyle(2, 0x67e8f9, 0.9);
          this.ghostPreviewGfx.strokeRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);
        } else {
          // Warning crimson ghost
          this.ghostPreviewGfx.fillStyle(0xf43f5e, 0.35);
          this.ghostPreviewGfx.fillRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);
          this.ghostPreviewGfx.lineStyle(1.5, 0xfb7185, 0.8);
          this.ghostPreviewGfx.strokeRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);
        }
      }
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    // Pulse targeting mode click
    if (this.gameState?.pulseActive) {
      this.handlePulsePointerUp(pointer);
      return;
    }

    if (!this.activeDrag || !this.gameState) return;

    const drag = this.activeDrag;
    this.activeDrag = null;
    this.ghostPreviewGfx.clear();

    let targetAnchor = this.currentHoverAnchor;
    if (!targetAnchor) {
      const padding = 8;
      const innerX = this.boardX + padding;
      const innerY = this.boardY + padding;
      const pieceDef = drag.definition;
      const halfWidth = (pieceDef.cols * this.cellSize) / 2;
      const halfHeight = (pieceDef.rows * this.cellSize) / 2;
      const anchorScreenX = drag.container.x - halfWidth;
      const anchorScreenY = drag.container.y - halfHeight;
      const rawCol = Math.round((anchorScreenX - innerX) / this.cellSize);
      const rawRow = Math.round((anchorScreenY - innerY) / this.cellSize);
      const valid = canPlacePiece(this.gameState.board, pieceDef, rawRow, rawCol);
      targetAnchor = { r: rawRow, c: rawCol, valid };
    }

    if (targetAnchor && targetAnchor.valid) {
      // Valid placement!
      soundManager.playPlace();
      const { r, c } = targetAnchor;
      this.currentHoverAnchor = null;
      this.callbacks.onMoveAttempt(drag.trayId, r, c);
    } else {
      // Invalid placement -> smooth return bounce
      soundManager.playInvalid();
      this.currentHoverAnchor = null;

      this.tweens.add({
        targets: drag.container,
        x: drag.originX,
        y: drag.originY,
        scale: drag.originScale,
        duration: this.reducedMotion ? 50 : 220,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          drag.container.setDepth(1);
        },
      });
    }
  }

  // Bloom Pulse targeting guides
  private renderPulseGuides(): void {
    this.pulseTargetGfx.clear();
    if (!this.gameState || !this.gameState.pulseActive) return;

    const padding = 8;
    const innerX = this.boardX + padding;
    const innerY = this.boardY + padding;

    // Glowing aura around the board in pulse mode
    this.pulseTargetGfx.lineStyle(3, 0xf59e0b, 0.9);
    this.pulseTargetGfx.strokeRoundedRect(this.boardX - 2, this.boardY - 2, this.boardPixelSize + 4, this.boardPixelSize + 4, 16);

    // If hovering a target, highlight entire row or col
    if (this.pulseHoverTarget) {
      const { type, index } = this.pulseHoverTarget;
      this.pulseTargetGfx.fillStyle(0xfde68a, 0.35);
      this.pulseTargetGfx.lineStyle(2, 0xf59e0b, 1);

      if (type === 'row') {
        const y = innerY + index * this.cellSize;
        this.pulseTargetGfx.fillRoundedRect(innerX, y, this.cellSize * BOARD_SIZE, this.cellSize, 6);
        this.pulseTargetGfx.strokeRoundedRect(innerX, y, this.cellSize * BOARD_SIZE, this.cellSize, 6);
      } else {
        const x = innerX + index * this.cellSize;
        this.pulseTargetGfx.fillRoundedRect(x, innerY, this.cellSize, this.cellSize * BOARD_SIZE, 6);
        this.pulseTargetGfx.strokeRoundedRect(x, innerY, this.cellSize, this.cellSize * BOARD_SIZE, 6);
      }
    }
  }

  private handlePulsePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.gameState || !this.gameState.pulseActive) return;

    const padding = 8;
    const innerX = this.boardX + padding;
    const innerY = this.boardY + padding;

    const x = pointer.x - innerX;
    const y = pointer.y - innerY;

    if (x >= 0 && x <= this.cellSize * BOARD_SIZE && y >= 0 && y <= this.cellSize * BOARD_SIZE) {
      const col = Math.floor(x / this.cellSize);
      const row = Math.floor(y / this.cellSize);

      // Determine whether row or column is closer to pointer edge or cell center
      // Let's allow row targeting or column targeting based on relative position
      const cellCenterX = col * this.cellSize + this.cellSize / 2;
      const cellCenterY = row * this.cellSize + this.cellSize / 2;
      const dx = Math.abs(x - cellCenterX);
      const dy = Math.abs(y - cellCenterY);

      let candidate: PulseTarget;
      if (dx > dy) {
        candidate = { type: 'col', index: col };
      } else {
        candidate = { type: 'row', index: row };
      }

      if (isEligiblePulseTarget(this.gameState.board, candidate)) {
        this.pulseHoverTarget = candidate;
      } else {
        // Fallback to the other orientation if candidate is empty
        const alt: PulseTarget = candidate.type === 'row' ? { type: 'col', index: col } : { type: 'row', index: row };
        this.pulseHoverTarget = isEligiblePulseTarget(this.gameState.board, alt) ? alt : null;
      }
    } else {
      this.pulseHoverTarget = null;
    }

    this.renderPulseGuides();
  }

  private handlePulsePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.gameState || !this.gameState.pulseActive || !this.pulseHoverTarget) return;

    soundManager.playPulseFire();
    const target = this.pulseHoverTarget;
    this.pulseHoverTarget = null;
    this.playPulseClearAnimation(target);
    this.callbacks.onPulseTargetSelect(target);
  }

  private playPulseClearAnimation(target: PulseTarget): void {
    if (this.reducedMotion) return;

    // Heavy pulse screen shake
    this.cameras.main.shake(260, 0.016);

    const padding = 8;
    const innerX = this.boardX + padding;
    const innerY = this.boardY + padding;

    // Firing beam laser sweep
    const beamGfx = this.add.graphics();
    beamGfx.setDepth(160);
    beamGfx.fillStyle(0xfde68a, 0.95);

    if (target.type === 'row') {
      const y = innerY + target.index * this.cellSize;
      beamGfx.fillRoundedRect(innerX, y, this.cellSize * BOARD_SIZE, this.cellSize, 6);
    } else {
      const x = innerX + target.index * this.cellSize;
      beamGfx.fillRoundedRect(x, innerY, this.cellSize, this.cellSize * BOARD_SIZE, 6);
    }

    this.tweens.add({
      targets: beamGfx,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        beamGfx.destroy();
      },
    });

    // Golden nova shards along the cleared line
    const colors = [0xf59e0b, 0xfde68a, 0x06b6d4, 0xffffff];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const cx = target.type === 'row' ? innerX + i * this.cellSize + this.cellSize / 2 : innerX + target.index * this.cellSize + this.cellSize / 2;
      const cy = target.type === 'row' ? innerY + target.index * this.cellSize + this.cellSize / 2 : innerY + i * this.cellSize + this.cellSize / 2;

      for (let s = 0; s < 5; s++) {
        const shard = this.add.graphics();
        shard.setDepth(170);
        const col = colors[Math.floor(Math.random() * colors.length)];
        const sz = Phaser.Math.Between(5, 9);
        shard.fillStyle(col, 1);
        shard.fillCircle(0, 0, sz / 2);
        shard.setPosition(cx, cy);

        const angle = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(30, 80);

        this.tweens.add({
          targets: shard,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          scale: 0.1,
          alpha: 0,
          duration: Phaser.Math.Between(300, 480),
          ease: 'Cubic.easeOut',
          onComplete: () => shard.destroy(),
        });
      }
    }

    // Callout text
    const midX = innerX + (BOARD_SIZE * this.cellSize) / 2;
    const midY = target.type === 'row' ? innerY + target.index * this.cellSize + this.cellSize / 2 : innerY + (BOARD_SIZE * this.cellSize) / 2;

    const pulseText = this.add.text(midX, midY, '⚡ BLOOM PULSE! ⚡', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FDE68A',
      stroke: '#0B0F19',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setDepth(210);

    pulseText.setScale(0.5);
    this.tweens.add({
      targets: pulseText,
      y: midY - 35,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: pulseText,
          alpha: 0,
          y: midY - 55,
          duration: 350,
          ease: 'Sine.easeIn',
          onComplete: () => pulseText.destroy(),
        });
      },
    });
  }

  private playClearAnimations(result: MoveResult): void {
    if (this.reducedMotion) return;

    const lineCount = result.clearedRows.length + result.clearedCols.length;
    if (lineCount <= 0 && result.totalClearedCells.length <= 0) return;

    const padding = 8;
    const innerX = this.boardX + padding;
    const innerY = this.boardY + padding;

    // 1. Visceral camera shake scaled by line count & combo
    const shakeIntensity = Math.min(0.016, 0.005 + lineCount * 0.003 + (result.newCombo > 1 ? 0.003 : 0));
    this.cameras.main.shake(200, shakeIntensity);

    // 2. Flash beam across cleared lines
    const beamGfx = this.add.graphics();
    beamGfx.setDepth(130);
    beamGfx.fillStyle(0xffffff, 0.9);

    for (const r of result.clearedRows) {
      beamGfx.fillRoundedRect(innerX, innerY + r * this.cellSize, this.cellSize * BOARD_SIZE, this.cellSize, 6);
    }
    for (const c of result.clearedCols) {
      beamGfx.fillRoundedRect(innerX + c * this.cellSize, innerY, this.cellSize, this.cellSize * BOARD_SIZE, 6);
    }

    this.tweens.add({
      targets: beamGfx,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        beamGfx.destroy();
      },
    });

    // 3. Play physical "BOOM" sound punch with jewel chimes
    soundManager.playLineClear(lineCount, result.newCombo);

    // 4. Calculate explosion center
    let avgX = innerX + (BOARD_SIZE * this.cellSize) / 2;
    let avgY = innerY + (BOARD_SIZE * this.cellSize) / 2;
    if (result.totalClearedCells.length > 0) {
      avgX = result.totalClearedCells.reduce((sum, pt) => sum + innerX + pt.c * this.cellSize + this.cellSize / 2, 0) / result.totalClearedCells.length;
      avgY = result.totalClearedCells.reduce((sum, pt) => sum + innerY + pt.r * this.cellSize + this.cellSize / 2, 0) / result.totalClearedCells.length;
    }

    // 5. Expanding blast shockwave ring
    const shockwave = this.add.graphics();
    shockwave.setDepth(150);
    const maxShockRadius = Math.max(90, lineCount * 70);

    this.tweens.addCounter({
      from: 8,
      to: maxShockRadius,
      duration: 380,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        const r = (tween.getValue() ?? 0) as number;
        const alpha = Math.max(0, 1 - (r / maxShockRadius));
        shockwave.clear();
        shockwave.lineStyle(3, 0xfde68a, alpha);
        shockwave.strokeCircle(avgX, avgY, r);
        shockwave.lineStyle(1.5, 0x06b6d4, alpha * 0.7);
        shockwave.strokeCircle(avgX, avgY, Math.max(0, r - 5));
      },
      onComplete: () => {
        shockwave.destroy();
      },
    });

    // 6. Exploding jewel shards & sparks bursting from every cleared block
    const shardColors = [0x06b6d4, 0x10b981, 0xf59e0b, 0xf43f5e, 0xa855f7, 0xffffff];
    for (const pt of result.totalClearedCells) {
      const cellCenterX = innerX + pt.c * this.cellSize + this.cellSize / 2;
      const cellCenterY = innerY + pt.r * this.cellSize + this.cellSize / 2;

      // Spawn 6 vibrant jewel particle shards per cell
      for (let i = 0; i < 6; i++) {
        const shard = this.add.graphics();
        shard.setDepth(140);
        const col = shardColors[Math.floor(Math.random() * shardColors.length)];
        const sz = Phaser.Math.Between(4, 7);
        shard.fillStyle(col, 1);
        shard.fillRoundedRect(-sz / 2, -sz / 2, sz, sz, 2);
        shard.setPosition(cellCenterX, cellCenterY);

        const angle = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(25, 80 + lineCount * 20);
        const targetX = cellCenterX + Math.cos(angle) * dist;
        const targetY = cellCenterY + Math.sin(angle) * dist;
        const duration = Phaser.Math.Between(340, 520);

        this.tweens.add({
          targets: shard,
          x: targetX,
          y: targetY,
          angle: Phaser.Math.Between(-180, 180),
          scale: 0.15,
          alpha: 0,
          duration,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            shard.destroy();
          },
        });
      }
    }

    // 7. Floating "BOOM!" callout badge
    let boomLabel = `+${result.scoreGained}`;
    if (result.newCombo > 1) {
      boomLabel = `💥 BOOM! x${result.newCombo}`;
    } else if (lineCount === 2) {
      boomLabel = `💥 DOUBLE BOOM!`;
    } else if (lineCount >= 3) {
      boomLabel = `💥 TRIPLE BLOOM!`;
    }

    const boomText = this.add.text(avgX, avgY - 10, boomLabel, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: result.newCombo > 1 || lineCount > 1 ? '22px' : '18px',
      fontStyle: 'bold',
      color: result.newCombo > 1 ? '#FDE68A' : '#38BDF8',
      stroke: '#0B0F19',
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setDepth(200);

    boomText.setScale(0.4);
    this.tweens.add({
      targets: boomText,
      y: avgY - 45,
      scale: 1.25,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: boomText,
          y: avgY - 65,
          alpha: 0,
          duration: 400,
          ease: 'Sine.easeIn',
          onComplete: () => {
            boomText.destroy();
          },
        });
      },
    });
  }
}
