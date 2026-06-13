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

test('lesson catalog covers every Part 5 teaching area', () => {
  assert.equal(getLessonsByCategory('basics').length, 16);
  assert.ok(getLessonsByCategory('openings').length >= 5);
  assert.ok(getLessonsByCategory('openings').length <= 10);
  assert.ok(getLessonsByCategory('strategy').length >= 5);
  assert.ok(getLessonsByCategory('endgames').length >= 3);
  assert.equal(LESSONS.length, 31);
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

test('stage seven keeps all lessons and makes every move-based lesson interactive', () => {
  const interactive = LESSONS.filter((lesson) => lesson.interactive);
  const staticLessons = LESSONS.filter((lesson) => !lesson.interactive);

  assert.equal(LESSONS.length, 31);
  assert.equal(interactive.length, 26);
  assert.deepEqual(
    staticLessons.map((lesson) => lesson.id),
    [
      'board-coordinates',
      'checkmate',
      'draw',
      'clock-basics',
      'pgn-basics',
    ],
  );
  assert.ok(
    interactive.every(
      (lesson) =>
        lesson.interactive &&
        lesson.interactive.steps.length > 0 &&
        lesson.interactive.goal.trim() &&
        lesson.recommended,
    ),
  );
});
