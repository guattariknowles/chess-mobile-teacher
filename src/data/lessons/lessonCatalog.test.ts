import {
  getLessonsByCategory,
  LESSONS,
  validateLessonCatalog,
} from './lessonCatalog';

declare const require: (id: string) => unknown;

type TestFunction = (name: string, callback: () => void) => void;
type Assert = {
  deepEqual: (actual: unknown, expected: unknown) => void;
  equal: (actual: unknown, expected: unknown) => void;
  ok: (value: unknown, message?: string) => void;
};

const test = require('node:test') as TestFunction;
const assert = require('node:assert/strict') as Assert;

test('stage eight expands every teaching area', () => {
  assert.equal(getLessonsByCategory('basics').length, 16);
  assert.equal(getLessonsByCategory('openings').length, 9);
  assert.equal(getLessonsByCategory('classics').length, 3);
  assert.equal(getLessonsByCategory('strategy').length, 7);
  assert.equal(getLessonsByCategory('endgames').length, 6);
  assert.equal(LESSONS.length, 41);
});

test('every lesson has a readable FEN and legal recommended move', () => {
  assert.deepEqual(validateLessonCatalog(), []);
});

test('advanced lessons explain a recommendation and a common mistake', () => {
  const advanced = LESSONS.filter(
    (lesson) => lesson.category !== 'basics',
  );

  assert.ok(
    advanced.every(
      (lesson) =>
        lesson.recommended?.explanation.trim() &&
        lesson.mistake?.explanation.trim(),
    ),
  );
});

test('stage eight makes every built-in lesson an AI game from the standard start', () => {
  const interactive = LESSONS.filter((lesson) => lesson.interactive);
  const staticLessons = LESSONS.filter((lesson) => !lesson.interactive);

  assert.equal(LESSONS.length, 41);
  assert.equal(interactive.length, 41);
  assert.deepEqual(staticLessons, []);
  assert.ok(
    interactive.every(
      (lesson) =>
        lesson.interactive &&
        lesson.interactive.steps.length > 0 &&
        lesson.interactive.goal.trim() &&
        lesson.interactive.startFen ===
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    ),
  );
  assert.ok(
    LESSONS.every(
      (lesson) =>
        lesson.training.source === 'built-in' &&
        lesson.training.standardStart &&
        lesson.training.objectives.length > 0 &&
        lesson.training.tags.length > 0,
    ),
  );
});

test('stage eight includes challenge and public classic-game training', () => {
  assert.equal(
    LESSONS.filter(
      (lesson) => lesson.training.format === 'challenge',
    ).length,
    7,
  );
  assert.equal(
    LESSONS.filter(
      (lesson) => lesson.training.format === 'classic-game',
    ).length,
    3,
  );
  assert.ok(
    getLessonsByCategory('classics').every(
      (lesson) => lesson.historical?.year,
    ),
  );
});
