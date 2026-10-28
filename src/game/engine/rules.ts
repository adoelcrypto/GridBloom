/**
 * GridBloom - Core Pure Game Logic and Scoring Rules
 * Framework-independent TypeScript engine.
 */

import { BOARD_SIZE, BoardCell, BoardMatrix, cloneBoard, isInsideBoard, createEmptyBoard } from './board';
import { PieceDefinition, PIECE_DEFINITIONS, ALL_PIECE_IDS, Point } from '../pieces/pieceTypes';
import { RandomSource, createMulberry32 } from './random';

export const MAX_PULSE_CHARGE = 100;
export const PULSE_CHARGE_PER_LINE = 20;
export const PULSE_CHARGE_COMBO_BONUS = 5;

export interface PlacedPieceInTray {
  readonly id: string;               // Unique instance ID (e.g. piece-1, piece-2)
  readonly definition: PieceDefinition;
  readonly used: boolean;
}

export interface GameState {
  readonly board: BoardCell[][];
  readonly tray: PlacedPieceInTray[];
  readonly score: number;
  readonly linesClearedTotal: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly pulseCharge: number;
  readonly pulseActive: boolean;    // In targeting mode for Bloom Pulse
  readonly isGameOver: boolean;
  readonly turnsCount: number;
  readonly lastMoveSummary: MoveResult | null;
}

export interface MoveResult {
  readonly success: boolean;
  readonly reason?: string;
  readonly placedCells: readonly Point[];
  readonly clearedRows: readonly number[];
  readonly clearedCols: readonly number[];
  readonly totalClearedCells: readonly Point[];
  readonly scoreGained: number;
  readonly newCombo: number;
  readonly pulseChargeGained: number;
  readonly isGameOver: boolean;
  readonly trayRefilled: boolean;
}

export interface PulseTarget {
  readonly type: 'row' | 'col';
  readonly index: number; // 0 to 7
}

export interface PulseResult {
  readonly success: boolean;
  readonly reason?: string;
  readonly target?: PulseTarget;
  readonly clearedCells: readonly Point[];
  readonly scoreGained: number;
  readonly isGameOver: boolean;
}

/**
 * Validates whether a piece can be placed at board coordinate (anchorRow, anchorCol).
 * Anchor (anchorRow, anchorCol) corresponds to (0, 0) of the piece's bounding box.
 */
export function canPlacePiece(
  board: BoardMatrix,
  piece: PieceDefinition,
  anchorRow: number,
  anchorCol: number
): boolean {
  for (const block of piece.blocks) {
    const targetRow = anchorRow + block.r;
    const targetCol = anchorCol + block.c;

    if (!isInsideBoard(targetRow, targetCol)) {
      return false;
    }

    if (board[targetRow][targetCol].filled) {
      return false;
    }
  }
  return true;
}

/**
 * Returns all cells that would be occupied by the piece if placed at anchor.
 * Returns null if the placement is invalid.
 */
export function getPlacementCells(
  board: BoardMatrix,
  piece: PieceDefinition,
  anchorRow: number,
  anchorCol: number
): Point[] | null {
  if (!canPlacePiece(board, piece, anchorRow, anchorCol)) {
    return null;
  }
  return piece.blocks.map((b) => ({
    r: anchorRow + b.r,
    c: anchorCol + b.c,
  }));
}

/**
 * Checks if a specific piece can legally fit anywhere on the current board.
 */
export function canPieceFitAnywhere(board: BoardMatrix, piece: PieceDefinition): boolean {
  for (let r = 0; r <= BOARD_SIZE - piece.rows; r++) {
    for (let c = 0; c <= BOARD_SIZE - piece.cols; c++) {
      if (canPlacePiece(board, piece, r, c)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if at least one available (unused) piece in the tray can fit anywhere on the board.
 * Returns false when the game is over.
 */
export function hasAnyLegalMoves(board: BoardMatrix, tray: readonly PlacedPieceInTray[]): boolean {
  const availablePieces = tray.filter((p) => !p.used);
  if (availablePieces.length === 0) {
    // If tray is empty/refilling, a move is possible once refilled
    return true;
  }
  return availablePieces.some((p) => canPieceFitAnywhere(board, p.definition));
}

/**
 * Detects completed rows and columns on the board.
 */
export function findCompletedLines(board: BoardMatrix): {
  rows: number[];
  cols: number[];
} {
  const completedRows: number[] = [];
  const completedCols: number[] = [];

  // Check rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    let rowFull = true;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c].filled) {
        rowFull = false;
        break;
      }
    }
    if (rowFull) {
      completedRows.push(r);
    }
  }

  // Check columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    let colFull = true;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (!board[r][c].filled) {
        colFull = false;
        break;
      }
    }
    if (colFull) {
      completedCols.push(c);
    }
  }

  return { rows: completedRows, cols: completedCols };
}

/**
 * Calculates simultaneous multiline bonus score.
 */
export function calculateMultiLineBonus(lineCount: number): number {
  if (lineCount <= 1) return 0;
  if (lineCount === 2) return 30;
  if (lineCount === 3) return 80;
  if (lineCount === 4) return 160;
  return 260; // 5 or more lines
}

/**
 * Refills the tray with 3 curated pieces from the random source.
 */
export function generateTray(rng: RandomSource, turnIndex = 0): PlacedPieceInTray[] {
  const pieceDefs = ALL_PIECE_IDS.map((id) => PIECE_DEFINITIONS[id]);
  const tray: PlacedPieceInTray[] = [];

  for (let i = 0; i < 3; i++) {
    const def = rng.weightedPick(pieceDefs);
    tray.push({
      id: `tray-${turnIndex}-${i}-${def.id}`,
      definition: def,
      used: false,
    });
  }

  return tray;
}

/**
 * Creates the initial game state.
 */
export function createInitialGameState(rng: RandomSource): GameState {
  const board = createEmptyBoard();
  const tray = generateTray(rng, 0);

  return {
    board,
    tray,
    score: 0,
    linesClearedTotal: 0,
    combo: 0,
    maxCombo: 0,
    pulseCharge: 0,
    pulseActive: false,
    isGameOver: false,
    turnsCount: 0,
    lastMoveSummary: null,
  };
}

/**
 * Executes a move on the game state. Returns a brand new state (pure function).
 * If move is invalid, returns the exact same state or state with error summary without mutations.
 */
export function executeMove(
  state: GameState,
  trayPieceId: string,
  anchorRow: number,
  anchorCol: number,
  rng: RandomSource
): { state: GameState; result: MoveResult } {
  if (state.isGameOver) {
    return {
      state,
      result: {
        success: false,
        reason: 'Game is already over',
        placedCells: [],
        clearedRows: [],
        clearedCols: [],
        totalClearedCells: [],
        scoreGained: 0,
        newCombo: state.combo,
        pulseChargeGained: 0,
        isGameOver: true,
        trayRefilled: false,
      },
    };
  }

  const trayIndex = state.tray.findIndex((p) => p.id === trayPieceId);
  if (trayIndex === -1) {
    return {
      state,
      result: {
        success: false,
        reason: 'Piece not found in tray',
        placedCells: [],
        clearedRows: [],
        clearedCols: [],
        totalClearedCells: [],
        scoreGained: 0,
        newCombo: state.combo,
        pulseChargeGained: 0,
        isGameOver: state.isGameOver,
        trayRefilled: false,
      },
    };
  }

  const trayPiece = state.tray[trayIndex];
  if (trayPiece.used) {
    return {
      state,
      result: {
        success: false,
        reason: 'Piece in tray has already been placed',
        placedCells: [],
        clearedRows: [],
        clearedCols: [],
        totalClearedCells: [],
        scoreGained: 0,
        newCombo: state.combo,
        pulseChargeGained: 0,
        isGameOver: state.isGameOver,
        trayRefilled: false,
      },
    };
  }

  const placedPoints = getPlacementCells(state.board, trayPiece.definition, anchorRow, anchorCol);
  if (!placedPoints) {
    return {
      state,
      result: {
        success: false,
        reason: 'Illegal placement: out of bounds or overlapping',
        placedCells: [],
        clearedRows: [],
        clearedCols: [],
        totalClearedCells: [],
        scoreGained: 0,
        newCombo: state.combo,
        pulseChargeGained: 0,
        isGameOver: state.isGameOver,
        trayRefilled: false,
      },
    };
  }

  // Placement is valid. Clone board and place the piece blocks
  const newBoard = cloneBoard(state.board);
  for (const pt of placedPoints) {
    newBoard[pt.r][pt.c] = {
      filled: true,
      color: trayPiece.definition.color,
      glowColor: trayPiece.definition.glowColor,
      pieceId: trayPiece.definition.id,
    };
  }

  // Base score for placing unit blocks
  const blockPlacementScore = placedPoints.length;

  // Detect completed lines
  const { rows, cols } = findCompletedLines(newBoard);
  const lineCount = rows.length + cols.length;

  // Track unique cells cleared (union of rows and cols without double counting intersections)
  const clearedSet = new Set<string>();
  const totalClearedCells: Point[] = [];

  for (const r of rows) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`;
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        totalClearedCells.push({ r, c });
      }
    }
  }

  for (const c of cols) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const key = `${r},${c}`;
      if (!clearedSet.has(key)) {
        clearedSet.add(key);
        totalClearedCells.push({ r, c });
      }
    }
  }

  // Clear cells on new board
  for (const pt of totalClearedCells) {
    newBoard[pt.r][pt.c] = {
      filled: false,
      color: null,
      glowColor: null,
      pieceId: null,
    };
  }

  // Calculate combo and line clear bonuses
  let newCombo = 0;
  let lineClearScore = 0;
  let multiLineBonus = 0;
  let comboBonus = 0;
  let pulseChargeGained = 0;

  if (lineCount > 0) {
    newCombo = state.combo + 1;
    lineClearScore = lineCount * 10;
    multiLineBonus = calculateMultiLineBonus(lineCount);
    comboBonus = (newCombo - 1) * 15;
    pulseChargeGained = lineCount * PULSE_CHARGE_PER_LINE + (newCombo - 1) * PULSE_CHARGE_COMBO_BONUS;
  } else {
    newCombo = 0;
  }

  const scoreGained = blockPlacementScore + lineClearScore + multiLineBonus + comboBonus;
  const newScore = state.score + scoreGained;
  const newLinesCleared = state.linesClearedTotal + lineCount;
  const newMaxCombo = Math.max(state.maxCombo, newCombo);
  const newPulseCharge = Math.min(MAX_PULSE_CHARGE, state.pulseCharge + pulseChargeGained);

  // Update tray: mark placed piece as used
  const updatedTray = state.tray.map((p, idx) => (idx === trayIndex ? { ...p, used: true } : p));

  // Check if all pieces in tray have been used
  let finalTray = updatedTray;
  let trayRefilled = false;
  const allUsed = updatedTray.every((p) => p.used);
  if (allUsed) {
    finalTray = generateTray(rng, state.turnsCount + 1);
    trayRefilled = true;
  }

  // Check game over
  const hasMoves = hasAnyLegalMoves(newBoard, finalTray);
  const isGameOver = !hasMoves;

  const result: MoveResult = {
    success: true,
    placedCells: placedPoints,
    clearedRows: rows,
    clearedCols: cols,
    totalClearedCells,
    scoreGained,
    newCombo,
    pulseChargeGained,
    isGameOver,
    trayRefilled,
  };

  const nextState: GameState = {
    board: newBoard,
    tray: finalTray,
    score: newScore,
    linesClearedTotal: newLinesCleared,
    combo: newCombo,
    maxCombo: newMaxCombo,
    pulseCharge: newPulseCharge,
    pulseActive: state.pulseActive && newPulseCharge === MAX_PULSE_CHARGE,
    isGameOver,
    turnsCount: state.turnsCount + 1,
    lastMoveSummary: result,
  };

  return { state: nextState, result };
}

/**
 * Validates whether a line target is eligible for Bloom Pulse.
 * Eligible: index is within 0..7, and the target row or column contains AT LEAST ONE filled cell.
 */
export function isEligiblePulseTarget(board: BoardMatrix, target: PulseTarget): boolean {
  if (target.index < 0 || target.index >= BOARD_SIZE) {
    return false;
  }

  if (target.type === 'row') {
    return board[target.index].some((cell) => cell.filled);
  } else {
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (board[r][target.index].filled) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Activates or executes Bloom Pulse on an eligible target.
 * Requires pulseCharge === MAX_PULSE_CHARGE.
 * Clears the chosen row or column, awards points, consumes 100 energy, and re-evaluates game over.
 */
export function executeBloomPulse(
  state: GameState,
  target: PulseTarget
): { state: GameState; result: PulseResult } {
  if (state.pulseCharge < MAX_PULSE_CHARGE) {
    return {
      state,
      result: {
        success: false,
        reason: 'Bloom Pulse energy is not fully charged',
        clearedCells: [],
        scoreGained: 0,
        isGameOver: state.isGameOver,
      },
    };
  }

  if (!isEligiblePulseTarget(state.board, target)) {
    return {
      state,
      result: {
        success: false,
        reason: 'Target line must not be empty or out of bounds',
        clearedCells: [],
        scoreGained: 0,
        isGameOver: state.isGameOver,
      },
    };
  }

  const newBoard = cloneBoard(state.board);
  const clearedCells: Point[] = [];

  if (target.type === 'row') {
    const r = target.index;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (newBoard[r][c].filled) {
        clearedCells.push({ r, c });
      }
      newBoard[r][c] = {
        filled: false,
        color: null,
        glowColor: null,
        pieceId: null,
      };
    }
  } else {
    const c = target.index;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (newBoard[r][c].filled) {
        clearedCells.push({ r, c });
      }
      newBoard[r][c] = {
        filled: false,
        color: null,
        glowColor: null,
        pieceId: null,
      };
    }
  }

  const scoreGained = clearedCells.length * 5 + 30; // 5 pts per vaporized cell + 30 pulse clear bonus
  const newScore = state.score + scoreGained;
  const newLinesCleared = state.linesClearedTotal + 1;

  // After clearing the line, check if any unused pieces in tray can now fit
  const hasMoves = hasAnyLegalMoves(newBoard, state.tray);
  const isGameOver = !hasMoves;

  const result: PulseResult = {
    success: true,
    target,
    clearedCells,
    scoreGained,
    isGameOver,
  };

  const nextState: GameState = {
    ...state,
    board: newBoard,
    score: newScore,
    linesClearedTotal: newLinesCleared,
    pulseCharge: 0, // Consumes exactly one full charge
    pulseActive: false,
    isGameOver,
  };

  return { state: nextState, result };
}

/**
 * Rescues a game over by clearing a cluttered 3x3 center zone or 2 random lines (Rewarded Ad rescue).
 * Can only be used once per run.
 */
export function executeRescue(state: GameState): GameState {
  if (!state.isGameOver) return state;

  const newBoard = cloneBoard(state.board);
  // Clear central 4x4 area to ensure ample space for pieces
  for (let r = 2; r <= 5; r++) {
    for (let c = 2; c <= 5; c++) {
      newBoard[r][c] = {
        filled: false,
        color: null,
        glowColor: null,
        pieceId: null,
      };
    }
  }

  const hasMoves = hasAnyLegalMoves(newBoard, state.tray);

  return {
    ...state,
    board: newBoard,
    isGameOver: !hasMoves,
  };
}
