import {
  createClockState,
  formatClockTime,
  NO_CLOCK_CONFIG,
  pauseClock,
  restoreClock,
  resumeClock,
  switchClock,
  tickClock,
} from './clockState';

declare const require: (id: string) => unknown;

type TestFunction = (
  name: string,
  callback: () => void | Promise<void>,
) => void;

type Assert = {
  equal: (actual: unknown, expected: unknown) => void;
};

const test = require('node:test') as TestFunction;
const assert = require('node:assert/strict') as Assert;

test('switches turns and adds the increment after a legal move', () => {
  const initial = createClockState(
    { incrementMs: 2_000, initialTimeMs: 60_000 },
    0,
  );
  const running = resumeClock(initial, 0);
  const switched = switchClock(running, 'b', 10_000);

  assert.equal(switched.whiteTimeMs, 52_000);
  assert.equal(switched.blackTimeMs, 60_000);
  assert.equal(switched.activeColor, 'b');
});

test('pause stops elapsed time until the clock is resumed', () => {
  const initial = createClockState(
    { incrementMs: 0, initialTimeMs: 60_000 },
    0,
  );
  const running = resumeClock(initial, 0);
  const paused = pauseClock(running, 5_000);
  const stillPaused = tickClock(paused, 20_000);
  const resumed = resumeClock(stillPaused, 20_000);
  const updated = tickClock(resumed, 25_000);

  assert.equal(paused.whiteTimeMs, 55_000);
  assert.equal(stillPaused.whiteTimeMs, 55_000);
  assert.equal(updated.whiteTimeMs, 50_000);
});

test('marks the active player as timed out at zero', () => {
  const initial = createClockState(
    { incrementMs: 0, initialTimeMs: 1_000 },
    0,
  );
  const running = resumeClock(initial, 0);
  const timedOut = tickClock(running, 1_000);

  assert.equal(timedOut.whiteTimeMs, 0);
  assert.equal(timedOut.timedOutColor, 'w');
  assert.equal(timedOut.isPaused, true);
});

test('restoring a clock snapshot does not count time spent after undo', () => {
  const initial = createClockState(
    { incrementMs: 0, initialTimeMs: 60_000 },
    0,
  );
  const running = resumeClock(initial, 0);
  const beforeMove = tickClock(running, 8_000);
  const restored = restoreClock(beforeMove, 30_000);
  const updated = tickClock(restored, 31_000);

  assert.equal(updated.whiteTimeMs, 51_000);
});

test('no-clock mode never loses time', () => {
  const initial = createClockState(NO_CLOCK_CONFIG, 0);
  const updated = switchClock(tickClock(initial, 50_000), 'b', 50_000);

  assert.equal(updated.whiteTimeMs, null);
  assert.equal(updated.blackTimeMs, null);
  assert.equal(updated.activeColor, 'b');
});

test('formats clock values for display', () => {
  assert.equal(formatClockTime(null), '--:--');
  assert.equal(formatClockTime(60_000), '1:00');
  assert.equal(formatClockTime(59_001), '1:00');
  assert.equal(formatClockTime(59_000), '0:59');
});
