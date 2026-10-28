import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_SIZE,
  createEmptyBoard,
  cloneBoard,
  isInsideBoard,
} from './board';
import {
  PIECE_DEFINITIONS,
  ALL_PIECE_IDS,
} from '../pieces/pieceTypes';
import {
  createMulberry32,
  stringToSeed,
} from './random';
import {
  canPlacePiece,
  getPlacementCells,
  canPieceFitAnywhere,
  findCompletedLines,
  calculateMultiLineBonus,
  createInitialGameState,
  executeMove,
  isEligiblePulseTarget,
  executeBloomPulse,
  executeRescue,
  MAX_PULSE_CHARGE,
  GameState,
} from './rules';
import { getTodayDateString, createDailyRandomSource } from './daily';

test('Board dimensions and initial empty state', () => {
  const board = createEmptyBoard();
  assert.equal(board.length, BOARD_SIZE);
  assert.equal(board[0].length, BOARD_SIZE);

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      assert.equal(board[r][c].filled, false);
      assert.equal(board[r][c].color, null);
    }
  }

  assert.equal(isInsideBoard(0, 0), true);
  assert.equal(isInsideBoard(7, 7), true);
  assert.equal(isInsideBoard(-1, 0), false);
  assert.equal(isInsideBoard(0, 8), false);
  assert.equal(isInsideBoard(8, 8), false);
});

test('Valid piece definitions consistency', () => {
  assert.ok(ALL_PIECE_IDS.length >= 15);
  for (const id of ALL_PIECE_IDS) {
    const piece = PIECE_DEFINITIONS[id];
    assert.equal(piece.id, id);
    assert.ok(piece.rows > 0 && piece.rows <= 5);
    assert.ok(piece.cols > 0 && piece.cols <= 5);
    assert.ok(piece.blocks.length > 0);
    assert.ok(piece.color.startsWith('#'));
    assert.ok(piece.glowColor.startsWith('#'));

    // Check that blocks match matrix
    for (const b of piece.blocks) {
      assert.ok(b.r >= 0 && b.r < piece.rows);
      assert.ok(b.c >= 0 && b.c < piece.cols);
      assert.equal(piece.matrix[b.r][b.c], 1);
    }
  }
});

test('Placement validation: legal, illegal out of bounds, and overlapping', () => {
  const board = createEmptyBoard();
  const square2 = PIECE_DEFINITIONS.square_2; // 2x2
  const line4 = PIECE_DEFINITIONS.line_4_h;  // 1x4

  // Legal placements
  assert.equal(canPlacePiece(board, square2, 0, 0), true);
  assert.equal(canPlacePiece(board, square2, 6, 6), true);
  assert.equal(canPlacePiece(board, line4, 0, 0), true);
  assert.equal(canPlacePiece(board, line4, 7, 4), true);

  // Illegal out of bounds
  assert.equal(canPlacePiece(board, square2, 7, 7), false); // overflows row 8, col 8
  assert.equal(canPlacePiece(board, line4, 0, 5), false);   // 5 + 4 = 9 > 8
  assert.equal(canPlacePiece(board, line4, -1, 0), false);

  // Overlapping
  board[1][1] = { filled: true, color: '#fff', glowColor: null, pieceId: 'test' };
  assert.equal(canPlacePiece(board, square2, 0, 0), false); // (1,1) is occupied
  assert.equal(canPlacePiece(board, square2, 2, 2), true);  // non-overlapping
});

test('State immutability after invalid moves', () => {
  const rng = createMulberry32(42);
  const initialState = createInitialGameState(rng);

  // Deep clone check
  const stateCopy = JSON.parse(JSON.stringify(initialState));

  // Try invalid piece ID
  const invalidResult1 = executeMove(initialState, 'non-existent-id', 0, 0, rng);
  assert.equal(invalidResult1.result.success, false);
  assert.deepEqual(invalidResult1.state.board, stateCopy.board);
  assert.equal(invalidResult1.state.score, 0);

  // Try out-of-bounds placement with first valid piece in tray
  const pieceId = initialState.tray[0].id;
  const invalidResult2 = executeMove(initialState, pieceId, 7, 7, rng);
  if (initialState.tray[0].definition.rows > 1 || initialState.tray[0].definition.cols > 1) {
    assert.equal(invalidResult2.result.success, false);
    assert.deepEqual(invalidResult2.state.board, stateCopy.board);
    assert.equal(invalidResult2.state.score, 0);
    assert.equal(invalidResult2.state.combo, 0);
  }
});

test('Row and column clearing and intersection cell handling', () => {
  const board = createEmptyBoard();

  // Fill entire row 2
  for (let c = 0; c < BOARD_SIZE; c++) {
    board[2][c] = { filled: true, color: '#10B981', glowColor: null, pieceId: 'p' };
  }

  // Fill entire column 3 (note intersection at (2, 3))
  for (let r = 0; r < BOARD_SIZE; r++) {
    board[r][3] = { filled: true, color: '#06B6D4', glowColor: null, pieceId: 'p' };
  }

  const { rows, cols } = findCompletedLines(board);
  assert.deepEqual(rows, [2]);
  assert.deepEqual(cols, [3]);

  // Total lines = 2
  assert.equal(rows.length + cols.length, 2);
  assert.equal(calculateMultiLineBonus(2), 30);
});

test('Scoring and combo increment and reset', () => {
  const rng = createMulberry32(12345);
  let state = createInitialGameState(rng);

  // Simulate a state where row 0 has 7 filled cells, and we place a 1x1 dot at (0, 7)
  for (let c = 0; c < 7; c++) {
    state.board[0][c] = { filled: true, color: '#aaa', glowColor: null, pieceId: 'setup' };
  }

  // Force tray[0] to be a 1x1 dot
  const dotDef = PIECE_DEFINITIONS.dot_1;
  const testTray = [
    { id: 'test-dot', definition: dotDef, used: false },
    { id: 'test-dummy-1', definition: dotDef, used: false },
    { id: 'test-dummy-2', definition: dotDef, used: false },
  ];
  state = { ...state, tray: testTray };

  // Place dot at (0, 7) to complete row 0
  const move1 = executeMove(state, 'test-dot', 0, 7, rng);
  assert.equal(move1.result.success, true);
  assert.equal(move1.result.clearedRows.length, 1);
  assert.equal(move1.result.newCombo, 1);
  // Score = 1 (block) + 10 (line) + 0 (single line) + 0 (combo 1 bonus = 0) = 11
  assert.equal(move1.result.scoreGained, 11);
  assert.equal(move1.state.combo, 1);

  // Next move: place a dot without clearing any line
  const move2 = executeMove(move1.state, 'test-dummy-1', 4, 4, rng);
  assert.equal(move2.result.success, true);
  assert.equal(move2.result.clearedRows.length, 0);
  assert.equal(move2.result.newCombo, 0); // resets combo
  assert.equal(move2.state.combo, 0);
});

test('Bloom Pulse charging, validation, target execution, and charge reset', () => {
  const rng = createMulberry32(999);
  let state = createInitialGameState(rng);

  // Setup board with some filled cells in row 3
  state.board[3][0] = { filled: true, color: '#10B981', glowColor: null, pieceId: 'p' };
  state.board[3][1] = { filled: true, color: '#10B981', glowColor: null, pieceId: 'p' };

  // Attempt pulse with 0 charge -> must fail
  const pulseFail1 = executeBloomPulse(state, { type: 'row', index: 3 });
  assert.equal(pulseFail1.result.success, false);

  // Charge to max (100)
  state = { ...state, pulseCharge: MAX_PULSE_CHARGE };

  // Attempt pulse on completely empty row -> must fail
  const pulseFail2 = executeBloomPulse(state, { type: 'row', index: 0 });
  assert.equal(pulseFail2.result.success, false);

  // Attempt pulse on out-of-bounds row -> must fail
  const pulseFail3 = executeBloomPulse(state, { type: 'row', index: 8 });
  assert.equal(pulseFail3.result.success, false);

  // Attempt valid pulse on row 3
  const pulseSuccess = executeBloomPulse(state, { type: 'row', index: 3 });
  assert.equal(pulseSuccess.result.success, true);
  assert.equal(pulseSuccess.state.pulseCharge, 0); // Consumes exactly 100
  assert.equal(pulseSuccess.state.board[3][0].filled, false);
  assert.equal(pulseSuccess.state.board[3][1].filled, false);
  assert.ok(pulseSuccess.state.score > state.score);
});

test('Tray refill after all 3 pieces are placed', () => {
  const rng = createMulberry32(777);
  let state = createInitialGameState(rng);

  const initialTrayIds = state.tray.map((p) => p.id);

  // Place first piece
  const p1 = state.tray[0];
  const m1 = executeMove(state, p1.id, 0, 0, rng);
  assert.equal(m1.result.trayRefilled, false);
  assert.equal(m1.state.tray[0].used, true);

  // Place second piece
  const p2 = m1.state.tray[1];
  const m2 = executeMove(m1.state, p2.id, 3, 0, rng);
  if (m2.result.success) {
    assert.equal(m2.result.trayRefilled, false);
    assert.equal(m2.state.tray[1].used, true);

    // Place third piece
    const p3 = m2.state.tray[2];
    const m3 = executeMove(m2.state, p3.id, 6, 0, rng);
    if (m3.result.success) {
      assert.equal(m3.result.trayRefilled, true);
      const newTrayIds = m3.state.tray.map((p) => p.id);
      // New tray pieces must have new ids and none should be used
      assert.notDeepEqual(newTrayIds, initialTrayIds);
      assert.ok(m3.state.tray.every((p) => !p.used));
    }
  }
});

test('Game over detection when no moves can fit', () => {
  const board = createEmptyBoard();
  // Fill almost entire board except 1 cell at (0, 0)
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (r !== 0 || c !== 0) {
        board[r][c] = { filled: true, color: '#f00', glowColor: null, pieceId: 'x' };
      }
    }
  }

  // A 2x2 square cannot fit
  assert.equal(canPieceFitAnywhere(board, PIECE_DEFINITIONS.square_2), false);

  // A 1x1 monomino CAN fit at (0, 0)
  assert.equal(canPieceFitAnywhere(board, PIECE_DEFINITIONS.dot_1), true);

  // If tray only contains square_2, no legal moves remain
  const trayOnlyBig = [
    { id: '1', definition: PIECE_DEFINITIONS.square_2, used: false },
  ];
  assert.equal(canPieceFitAnywhere(board, trayOnlyBig[0].definition), false);
});

test('Seeded PRNG reproducibility', () => {
  const rng1 = createMulberry32(42);
  const rng2 = createMulberry32(42);

  for (let i = 0; i < 50; i++) {
    assert.equal(rng1.next(), rng2.next());
  }

  const s1 = stringToSeed('2026-10-28');
  const s2 = stringToSeed('2026-10-28');
  assert.equal(s1, s2);

  const dailyRng1 = createDailyRandomSource('2026-10-28');
  const dailyRng2 = createDailyRandomSource('2026-10-28');
  for (let i = 0; i < 20; i++) {
    assert.equal(dailyRng1.nextInt(0, 100), dailyRng2.nextInt(0, 100));
  }
});
