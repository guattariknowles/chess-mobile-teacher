import { Chess } from 'chess.js';

import {
  chooseAiMove,
  getAiGameParticipants,
  getAiName,
} from './localAi';

declare const require: (id: string) => unknown;

type TestFunction = (
  name: string,
  callback: () => void | Promise<void>,
) => void;

type Assert = {
  equal: (actual: unknown, expected: unknown) => void;
  notEqual: (actual: unknown, expected: unknown) => void;
  ok: (value: unknown) => void;
};

const test = require('node:test') as TestFunction;
const assert = require('node:assert/strict') as Assert;

function moveKey(move: {
  from: string;
  promotion?: string;
  to: string;
}): string {
  return `${move.from}-${move.to}-${move.promotion ?? ''}`;
}

test('novice AI always returns a legal move', () => {
  const chess = new Chess();
  const legalMoves = new Set(
    chess.moves({ verbose: true }).map((move) => moveKey(move)),
  );
  const move = chooseAiMove(chess.fen(), 'novice', () => 0.42);

  assert.ok(move);
  assert.equal(move ? legalMoves.has(moveKey(move)) : false, true);
});

test('fixed random values select stable novice moves', () => {
  const chess = new Chess();
  const legalMoves = chess.moves({ verbose: true });
  const first = chooseAiMove(chess.fen(), 'novice', () => 0);
  const last = chooseAiMove(chess.fen(), 'novice', () => 0.999999);

  assert.equal(first ? moveKey(first) : '', moveKey(legalMoves[0]));
  assert.equal(
    last ? moveKey(last) : '',
    moveKey(legalMoves[legalMoves.length - 1]),
  );
});

test('beginner AI prefers a capture when one is available', () => {
  const move = chooseAiMove(
    '4k3/8/8/3q4/4P3/8/8/4K3 b - - 0 1',
    'beginner',
    () => 0,
  );

  assert.equal(move?.from, 'd5');
  assert.equal(move?.to, 'e4');
  assert.equal(move?.captured, 'p');
});

test('beginner AI still moves when no capture is available', () => {
  const move = chooseAiMove(new Chess().fen(), 'beginner', () => 0.25);

  assert.ok(move);
});

test('intermediate AI prefers capturing a queen over a pawn', () => {
  const move = chooseAiMove(
    '4k3/8/8/3q4/2P1Q3/8/8/4K3 b - - 0 1',
    'intermediate',
    () => 0,
  );

  assert.equal(move?.from, 'd5');
  assert.equal(move?.to, 'e4');
  assert.equal(move?.captured, 'q');
});

test('intermediate AI evaluates material from the black side correctly', () => {
  const move = chooseAiMove(
    '4k3/8/8/3q4/2P1Q3/8/8/4K3 b - - 0 1',
    'intermediate',
    () => 0.5,
  );

  assert.equal(move?.captured, 'q');
});

test('intermediate AI prioritizes a one-move checkmate', () => {
  const move = chooseAiMove(
    '6k1/5ppp/8/8/8/3Q4/8/6K1 w - - 0 1',
    'intermediate',
    () => 0,
  );
  const chess = new Chess(
    '6k1/5ppp/8/8/8/3Q4/8/6K1 w - - 0 1',
  );

  assert.ok(move);
  if (move) {
    chess.move(move);
  }
  assert.equal(chess.isCheckmate(), true);
});

test('intermediate AI values queen promotion highest', () => {
  const move = chooseAiMove(
    '7k/P7/8/8/8/8/8/7K w - - 0 1',
    'intermediate',
    () => 0,
  );

  assert.equal(move?.from, 'a7');
  assert.equal(move?.to, 'a8');
  assert.equal(move?.promotion, 'q');
});

test('AI returns null when the position has no legal move', () => {
  const move = chooseAiMove(
    '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
    'intermediate',
  );

  assert.equal(move, null);
});

test('intermediate AI uses randomness to break equal-score ties', () => {
  const fen = new Chess().fen();
  const first = chooseAiMove(fen, 'intermediate', () => 0);
  const last = chooseAiMove(fen, 'intermediate', () => 0.999999);

  assert.ok(first);
  assert.ok(last);
  assert.notEqual(
    first ? moveKey(first) : '',
    last ? moveKey(last) : '',
  );
});

test('AI difficulty names are fixed local participants', () => {
  assert.equal(getAiName('novice'), '新手 AI');
  assert.equal(getAiName('beginner'), '初级 AI');
  assert.equal(getAiName('intermediate'), '中级 AI');
});

test('AI game participants only link the human profile', () => {
  const participants = getAiGameParticipants(
    { id: 'profile-a', name: 'Alice' },
    'beginner',
    'b',
  );

  assert.equal(participants.w.name, '初级 AI');
  assert.equal(participants.w.profileId, undefined);
  assert.equal(participants.b.name, 'Alice');
  assert.equal(participants.b.profileId, 'profile-a');
});
