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
  freePlay: boolean;
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
    freePlay: state.freePlay,
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
  const game = new ChessGame(interactive.startFen, {
    allowMovesAfterGameOver: true,
  });
  const initialMove = interactive.initialOpponent
    ? getOpponentMove(
        {
          acceptedMoves: [],
          explanation: '',
          hint: '',
          id: 'initial-opponent',
          incorrectFeedback: '',
          instruction: '',
          opponent: interactive.initialOpponent,
        },
        interactive.startFen,
        Math.random,
      )
    : null;
  const appliedInitialMove = initialMove
    ? applyMove(game, initialMove)
    : null;
  const snapshot = game.getSnapshot();
  const freePlay =
    interactive.steps.length === 0 && interactive.freePlay !== undefined;

  return {
    awaitingAdvance: false,
    completed: false,
    errors: 0,
    feedback: {
      kind: 'info',
      message: `${interactive.intro}${
        appliedInitialMove
          ? ` AI 先走 ${appliedInitialMove.san}，现在轮到你。`
          : ''
      }`,
    },
    fen: snapshot.fen,
    freePlay,
    history: [],
    lessonId: lesson.id,
    moves: appliedInitialMove ? [appliedInitialMove] : [],
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

  if (state.freePlay) {
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
          message: '这步不符合棋规，请重新选择。',
        },
      };
    }

    const history = [...state.history, checkpointState(state)];
    const userMove = applyMove(game, input);
    let snapshot = game.getSnapshot();
    const opponentMove = snapshot.status.isGameOver
      ? null
      : chooseAiMove(
          snapshot.fen,
          interactive.freePlay?.difficulty ?? 'intermediate',
          random,
        );
    const appliedOpponentMove = opponentMove
      ? applyMove(game, opponentMove)
      : null;

    snapshot = game.getSnapshot();
    const completed = snapshot.status.isGameOver;

    return {
      ...state,
      completed,
      feedback: {
        kind: completed ? 'complete' : 'correct',
        message: completed
          ? `${snapshot.status.message} ${interactive.completion}`
          : `你走了 ${userMove.san}。${
              appliedOpponentMove
                ? ` AI 回应 ${appliedOpponentMove.san}。`
                : ''
            }继续自由对弈。`,
      },
      fen: snapshot.fen,
      history,
      moves: [
        ...state.moves,
        userMove,
        ...(appliedOpponentMove ? [appliedOpponentMove] : []),
      ],
      turn: snapshot.status.turn,
    };
  }

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
  let snapshot = game.getSnapshot();
  const isFinalStep = state.stepIndex === interactive.steps.length - 1;
  const startsFreePlay = isFinalStep && interactive.freePlay !== undefined;
  const responseText = appliedOpponentMove
    ? ` 对手回应 ${appliedOpponentMove.san}。`
    : '';
  const transitionText = step.transition
    ? ` ${step.transition.message}`
    : '';

  if (step.transition) {
    snapshot = new ChessGame(step.transition.fen, {
      allowMovesAfterGameOver: true,
    }).getSnapshot();
  }

  return {
    awaitingAdvance: !isFinalStep,
    completed: isFinalStep && !startsFreePlay,
    errors: state.errors,
    feedback: {
      kind: isFinalStep && !startsFreePlay ? 'complete' : 'correct',
      message: `${step.explanation}${responseText}${transitionText}${
        isFinalStep
          ? startsFreePlay
            ? ' 导入的开局训练已完成，现在由 AI 自主回应，继续把棋下完。'
            : ` ${interactive.completion}`
          : ''
      }`,
    },
    fen: snapshot.fen,
    freePlay: startsFreePlay,
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
