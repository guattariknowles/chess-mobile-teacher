import { LESSONS } from '../data/lessons/lessonCatalog';
import {
  advanceLesson,
  attemptLessonMove,
  createLessonRuntime,
  restartLesson,
  showLessonHint,
  undoLessonMove,
} from './lessonRuntime';

declare const require: (id: string) => unknown;

type TestFunction = (name: string, callback: () => void) => void;
type Assert = {
  equal: (actual: unknown, expected: unknown) => void;
  match: (actual: string, expected: RegExp) => void;
  ok: (value: unknown, message?: string) => void;
};

const test = require('node:test') as TestFunction;
const assert = require('node:assert/strict') as Assert;

function getLesson(id: string) {
  const lesson = LESSONS.find((item) => item.id === id);

  if (!lesson) {
    throw new Error(`找不到课程：${id}`);
  }

  return lesson;
}

test('Italian lesson accepts the main line and constrained AI replies', () => {
  const lesson = getLesson('opening-italian');
  let state = createLessonRuntime(lesson);

  state = attemptLessonMove(lesson, state, {
    from: 'e2',
    to: 'e4',
  });
  assert.equal(state.awaitingAdvance, true);
  assert.equal(state.moves.map((move) => move.san).join(' '), 'e4 e5');

  state = advanceLesson(lesson, state);
  state = attemptLessonMove(lesson, state, {
    from: 'g1',
    to: 'f3',
  });
  state = advanceLesson(lesson, state);
  state = attemptLessonMove(lesson, state, {
    from: 'f1',
    to: 'c4',
  });

  assert.equal(state.completed, true);
  assert.equal(
    state.moves.map((move) => move.san).join(' '),
    'e4 e5 Nf3 Nc6 Bc4',
  );
});

test('recommended-move lessons receive a working generated interaction', () => {
  const lesson = getLesson('piece-knight');
  const state = attemptLessonMove(
    lesson,
    createLessonRuntime(lesson),
    { from: 'd4', to: 'f5' },
    () => 0,
  );

  assert.equal(state.completed, true);
  assert.equal(state.moves[0].from, 'd4');
  assert.equal(state.moves[0].to, 'f5');
  assert.ok(state.moves.length >= 1);
});

test('wrong and illegal moves give feedback without changing the board', () => {
  const lesson = getLesson('opening-italian');
  const initial = createLessonRuntime(lesson);
  const wrong = attemptLessonMove(lesson, initial, {
    from: 'a2',
    to: 'a3',
  });
  const illegal = attemptLessonMove(lesson, wrong, {
    from: 'e2',
    to: 'e5',
  });

  assert.equal(wrong.fen, initial.fen);
  assert.equal(illegal.fen, initial.fen);
  assert.equal(illegal.errors, 2);
  assert.equal(illegal.feedback.kind, 'error');
});

test('strategy lesson uses local AI only inside its allowed replies', () => {
  const lesson = getLesson('strategy-center');
  const state = attemptLessonMove(
    lesson,
    createLessonRuntime(lesson),
    { from: 'd2', to: 'd4' },
    () => 0.75,
  );

  assert.equal(state.completed, true);
  assert.equal(state.moves[0].san, 'd4');
  assert.equal(state.moves[1].from, 'g8');
  assert.equal(state.moves[1].to, 'f6');
});

test('endgame lesson supports hint, undo, retry and restart', () => {
  const lesson = getLesson('endgame-king-pawn');
  const initial = createLessonRuntime(lesson);
  const hinted = showLessonHint(lesson, initial);
  const firstStep = attemptLessonMove(
    lesson,
    hinted,
    { from: 'e5', to: 'd5' },
    () => 0,
  );

  assert.equal(hinted.feedback.kind, 'hint');
  assert.equal(firstStep.moves.length, 2);

  const undone = undoLessonMove(firstStep);
  assert.equal(undone.fen, initial.fen);
  assert.equal(undone.moves.length, 0);

  const retried = advanceLesson(
    lesson,
    attemptLessonMove(
      lesson,
      undone,
      { from: 'e5', to: 'd5' },
      () => 0,
    ),
  );
  const completed = attemptLessonMove(lesson, retried, {
    from: 'e4',
    to: 'e5',
  });

  assert.equal(completed.completed, true);
  assert.match(completed.feedback.message, /通路兵/);

  const restarted = restartLesson(lesson);
  assert.equal(restarted.fen, initial.fen);
  assert.equal(restarted.completed, false);
  assert.equal(restarted.errors, 0);
});
