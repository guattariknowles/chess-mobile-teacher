import type { Color } from 'chess.js';

export type ClockConfig = {
  incrementMs: number;
  initialTimeMs: number | null;
};

export type ClockState = {
  activeColor: Color;
  blackTimeMs: number | null;
  config: ClockConfig;
  isPaused: boolean;
  lastUpdatedAt: number;
  timedOutColor?: Color;
  whiteTimeMs: number | null;
};

export const NO_CLOCK_CONFIG: ClockConfig = {
  incrementMs: 0,
  initialTimeMs: null,
};

export function createClockState(
  config: ClockConfig,
  now: number,
): ClockState {
  return {
    activeColor: 'w',
    blackTimeMs: config.initialTimeMs,
    config,
    isPaused: config.initialTimeMs !== null,
    lastUpdatedAt: now,
    whiteTimeMs: config.initialTimeMs,
  };
}

export function isClockEnabled(state: ClockState): boolean {
  return state.config.initialTimeMs !== null;
}

export function tickClock(state: ClockState, now: number): ClockState {
  if (
    !isClockEnabled(state) ||
    state.isPaused ||
    state.timedOutColor
  ) {
    return state;
  }

  const elapsed = Math.max(0, now - state.lastUpdatedAt);

  if (elapsed === 0) {
    return state;
  }

  const timeKey =
    state.activeColor === 'w' ? 'whiteTimeMs' : 'blackTimeMs';
  const remaining = state[timeKey] ?? 0;

  if (elapsed >= remaining) {
    return {
      ...state,
      [timeKey]: 0,
      isPaused: true,
      lastUpdatedAt: now,
      timedOutColor: state.activeColor,
    };
  }

  return {
    ...state,
    [timeKey]: remaining - elapsed,
    lastUpdatedAt: now,
  };
}

export function switchClock(
  state: ClockState,
  nextColor: Color,
  now: number,
): ClockState {
  const updated = tickClock(state, now);

  if (updated.timedOutColor) {
    return updated;
  }

  if (!isClockEnabled(updated)) {
    return {
      ...updated,
      activeColor: nextColor,
      lastUpdatedAt: now,
    };
  }

  const timeKey =
    updated.activeColor === 'w' ? 'whiteTimeMs' : 'blackTimeMs';

  return {
    ...updated,
    [timeKey]: (updated[timeKey] ?? 0) + updated.config.incrementMs,
    activeColor: nextColor,
    lastUpdatedAt: now,
  };
}

export function pauseClock(state: ClockState, now: number): ClockState {
  const updated = tickClock(state, now);

  if (!isClockEnabled(updated) || updated.isPaused) {
    return updated;
  }

  return {
    ...updated,
    isPaused: true,
    lastUpdatedAt: now,
  };
}

export function resumeClock(state: ClockState, now: number): ClockState {
  if (
    !isClockEnabled(state) ||
    !state.isPaused ||
    state.timedOutColor
  ) {
    return state;
  }

  return {
    ...state,
    isPaused: false,
    lastUpdatedAt: now,
  };
}

export function stopClock(state: ClockState, now: number): ClockState {
  const updated = tickClock(state, now);

  return {
    ...updated,
    isPaused: true,
    lastUpdatedAt: now,
  };
}

export function restoreClock(
  state: ClockState,
  now: number,
): ClockState {
  return {
    ...state,
    lastUpdatedAt: now,
    timedOutColor: undefined,
  };
}

export function formatClockTime(timeMs: number | null): string {
  if (timeMs === null) {
    return '--:--';
  }

  const totalSeconds = Math.max(0, Math.ceil(timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getClockConfigLabel(config: ClockConfig): string {
  if (config.initialTimeMs === null) {
    return '无棋钟';
  }

  const minutes = config.initialTimeMs / 60_000;
  const incrementSeconds = config.incrementMs / 1000;

  return `${minutes}+${incrementSeconds}`;
}
