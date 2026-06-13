import type { Color } from 'chess.js';

import type {
  ChessLesson,
  InteractiveLesson,
  InteractiveLessonMove,
  InteractiveLessonStep,
} from '../data/lessons/lessonCatalog';
import { ChessGame, type LegalMove } from './chessState';
import { chooseAiMove } from './localAi';

export type LessonFeedback = {
  kind: 'complete' | 'correct' | 'error' | 'hint' | 'info';
  message: string;
};

type LessonRuntimeCheckpoint = {
  awaitingAdvance: boolean;
  completed: boolean;
  errors: number;
  feedback: LessonFeedback;
  fen: string;
  moves: LegalMove[];
  stepIndex: number;
  turn: Color;
};

export type LessonRuntimeState = LessonRuntimeCheckpoint & {
  history: LessonRuntimeCheckpoint[];
  lessonId: string;
};

export type LessonMoveInput = InteractiveLessonMove;

function getInteractiveLesson(lesson: ChessLesson): InteractiveLesson {
  if (!lesson.interactive) {
    throw new Error(`${lesson.id}: 课程没有互动练习`);
  }

  return lesson.interactive;
}

function checkpointState(
  state: LessonRuntimeState,
): LessonRuntimeCheckpoint {
  return {
    awaitingAdvance: state.awaitingAdvance,
    completed: state.completed,
    errors: state.errors,
    feedback: state.feedback,
    fen: state.fen,
    moves: [...state.moves],
    stepIndex: state.stepIndex,
    turn: state.turn,
  };
}

function movesMatch(
  expected: InteractiveLessonMove,
  actual: InteractiveLessonMove,
): boolean {
  return (
    expected.from === actual.from &&
    expected.to === actual.to &&
    (expected.promotion === undefined ||
      expected.promotion === actual.promotion)
  );
}

function applyMove(
  game: ChessGame,
  move: InteractiveLessonMove,
): LegalMove {
  const result = game.move(move.from, move.to, move.promotion);

  if (!result.success) {
    throw new Error(`课程走法不合法：${move.from}-${move.to}`);
  }

  return result.move;
}

function getOpponentMove(
  step: InteractiveLessonStep,
  fen: string,
  random: () => number,
): LegalMove | null {
  const opponent = step.opponent;

  if (!opponent) {
    return null;
  }

  if (opponent.mode === 'scripted') {
    if (!opponent.allowedMoves?.[0]) {
      throw new Error(`${step.id}: 固定回应缺少走法`);
    }

    const game = new ChessGame(fen, {
      allowMovesAfterGameOver: true,
    });
    return applyMove(game, opponent.allowedMoves[0]);
  }

  return chooseAiMove(
    fen,
    opponent.difficulty,
    random,
    opponent.allowedMoves,
  );
}

export function createLessonRuntime(
  lesson: ChessLesson,
): LessonRuntimeState {
  const interactive = getInteractiveLesson(lesson);
  const snapshot = new ChessGame(interactive.startFen, {
    allowMovesAfterGameOver: true,
  }).getSnapshot();

  return {
    awaitingAdvance: false,
    completed: false,
    errors: 0,
    feedback: {
      kind: 'info',
      message: interactive.intro,
    },
    fen: snapshot.fen,
    history: [],
    lessonId: lesson.id,
    moves: [],
    stepIndex: 0,
    turn: snapshot.status.turn,
  };
}

export function getCurrentLessonStep(
  lesson: ChessLesson,
  state: LessonRuntimeState,
): InteractiveLessonStep | null {
  return getInteractiveLesson(lesson).steps[state.stepIndex] ?? null;
}

export function attemptLessonMove(
  lesson: ChessLesson,
  state: LessonRuntimeState,
  input: LessonMoveInput,
  random: () => number = Math.random,
): LessonRuntimeState {
  if (state.completed || state.awaitingAdvance) {
    return state;
  }

  const interactive = getInteractiveLesson(lesson);
  const step = interactive.steps[state.stepIndex];

  if (!step) {
    return state;
  }

  const game = new ChessGame(state.fen, {
    allowMovesAfterGameOver: true,
  });
  const legalMove = game
    .getLegalMoves(input.from)
    .find((move) => movesMatch(move, input));

  if (!legalMove) {
    return {
      ...state,
      errors: state.errors + 1,
      feedback: {
        kind: 'error',
        message: `这步不符合棋规。${step.incorrectFeedback}`,
      },
    };
  }

  if (!step.acceptedMoves.some((move) => movesMatch(move, input))) {
    return {
      ...state,
      errors: state.errors + 1,
      feedback: {
        kind: 'error',
        message: step.incorrectFeedback,
      },
    };
  }

  const history = [...state.history, checkpointState(state)];
  const userMove = applyMove(game, input);
  const opponentMove = getOpponentMove(
    step,
    game.getSnapshot().fen,
    random,
  );

  if (step.opponent && !opponentMove) {
    throw new Error(`${lesson.id}/${step.id}: 对手没有可用的受限回应`);
  }

  const appliedOpponentMove = opponentMove
    ? applyMove(game, opponentMove)
    : null;
  const snapshot = game.getSnapshot();
  const isFinalStep = state.stepIndex === interactive.steps.length - 1;
  const responseText = appliedOpponentMove
    ? ` 对手回应 ${appliedOpponentMove.san}。`
    : '';

  return {
    awaitingAdvance: !isFinalStep,
    completed: isFinalStep,
    errors: state.errors,
    feedback: {
      kind: isFinalStep ? 'complete' : 'correct',
      message: `${step.explanation}${responseText}${
        isFinalStep ? ` ${interactive.completion}` : ''
      }`,
    },
    fen: snapshot.fen,
    history,
    lessonId: state.lessonId,
    moves: [
      ...state.moves,
      userMove,
      ...(appliedOpponentMove ? [appliedOpponentMove] : []),
    ],
    stepIndex: state.stepIndex,
    turn: snapshot.status.turn,
  };
}

export function advanceLesson(
  lesson: ChessLesson,
  state: LessonRuntimeState,
): LessonRuntimeState {
  if (!state.awaitingAdvance || state.completed) {
    return state;
  }

  const interactive = getInteractiveLesson(lesson);
  const nextStepIndex = state.stepIndex + 1;
  const nextStep = interactive.steps[nextStepIndex];

  if (!nextStep) {
    return {
      ...state,
      awaitingAdvance: false,
      completed: true,
      feedback: {
        kind: 'complete',
        message: interactive.completion,
      },
    };
  }

  return {
    ...state,
    awaitingAdvance: false,
    feedback: {
      kind: 'info',
      message: nextStep.instruction,
    },
    stepIndex: nextStepIndex,
  };
}

export function showLessonHint(
  lesson: ChessLesson,
  state: LessonRuntimeState,
): LessonRuntimeState {
  if (state.completed) {
    return state;
  }

  const step = getCurrentLessonStep(lesson, state);

  return step
    ? {
        ...state,
        feedback: {
          kind: 'hint',
          message: step.hint,
        },
      }
    : state;
}

export function undoLessonMove(
  state: LessonRuntimeState,
): LessonRuntimeState {
  const previous = state.history[state.history.length - 1];

  return previous
    ? {
        ...previous,
        history: state.history.slice(0, -1),
        lessonId: state.lessonId,
      }
    : state;
}

export function restartLesson(
  lesson: ChessLesson,
): LessonRuntimeState {
  return createLessonRuntime(lesson);
}
