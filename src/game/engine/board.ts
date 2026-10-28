/**
 * GridBloom - 8x8 Board Structure and Helpers
 */

export const BOARD_SIZE = 8;

export interface BoardCell {
  readonly filled: boolean;
  readonly color: string | null;
  readonly glowColor: string | null;
  readonly pieceId: string | null;
}

export type BoardMatrix = readonly (readonly BoardCell[])[];

export function createEmptyBoard(): BoardCell[][] {
  const grid: BoardCell[][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push({
        filled: false,
        color: null,
        glowColor: null,
        pieceId: null,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function cloneBoard(board: BoardMatrix): BoardCell[][] {
  return board.map((row) =>
    row.map((cell) => ({
      filled: cell.filled,
      color: cell.color,
      glowColor: cell.glowColor,
      pieceId: cell.pieceId,
    }))
  );
}

export function isInsideBoard(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}
