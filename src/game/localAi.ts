import {
  Chess,
  type Color,
  type Move,
  type PieceSymbol,
} from 'chess.js';

import type { LegalMove, PromotionPiece } from './chessState';

export type AiDifficulty = 'novice' | 'beginner' | 'intermediate';

export type AiGameParticipant = {
  isAi: boolean;
  name: string;
  profileId?: string;
};

export type AiMoveConstraint = {
  from: Move['from'];
  promotion?: PromotionPiece;
  to: Move['to'];
};

const AI_NAMES: Record<AiDifficulty, string> = {
  beginner: '初级 AI',
  intermediate: '中级 AI',
  novice: '新手 AI',
};

const PIECE_VALUES: Record<PieceSymbol, number> = {
  b: 330,
  k: 0,
  n: 320,
  p: 100,
  q: 900,
  r: 500,
};

const CHECKMATE_SCORE = 1_000_000;

function toLegalMove(move: Move): LegalMove {
  return {
    captured: move.captured,
    from: move.from,
    promotion: move.promotion as PromotionPiece | undefined,
    san: move.san,
    to: move.to,
  };
}

function chooseRandom<T>(items: T[], random: () => number): T {
  const normalized = Math.min(Math.max(random(), 0), 0.999999999);
  return items[Math.floor(normalized * items.length)];
}

function evaluateMaterial(chess: Chess, aiColor: Color): number {
  return chess
    .board()
    .flat()
    .filter((piece): piece is NonNullable<typeof piece> => piece !== null)
    .reduce(
      (score, piece) =>
        score +
        PIECE_VALUES[piece.type] * (piece.color === aiColor ? 1 : -1),
      0,
    );
}

function evaluateMove(chess: Chess, move: Move, aiColor: Color): number {
  chess.move({
    from: move.from,
    promotion: move.promotion,
    to: move.to,
  });

  let score: number;

  if (chess.isCheckmate()) {
    score = CHECKMATE_SCORE;
  } else if (chess.isDraw()) {
    score = 0;
  } else {
    score = evaluateMaterial(chess, aiColor);
  }

  chess.undo();
  return score;
}

export function getAiName(difficulty: AiDifficulty): string {
  return AI_NAMES[difficulty];
}

export function getAiGameParticipants(
  human: { id: string; name: string },
  difficulty: AiDifficulty,
  humanColor: Color,
): Record<Color, AiGameParticipant> {
  const ai: AiGameParticipant = {
    isAi: true,
    name: getAiName(difficulty),
  };
  const player: AiGameParticipant = {
    isAi: false,
    name: human.name,
    profileId: human.id,
  };

  return humanColor === 'w'
    ? { b: ai, w: player }
    : { b: player, w: ai };
}

export function chooseAiMove(
  fen: string,
  difficulty: AiDifficulty,
  random: () => number = Math.random,
  allowedMoves?: AiMoveConstraint[],
): LegalMove | null {
  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });
  const moves = allowedMoves
    ? legalMoves.filter((move) =>
        allowedMoves.some(
          (allowed) =>
            allowed.from === move.from &&
            allowed.to === move.to &&
            (allowed.promotion === undefined ||
              allowed.promotion === move.promotion),
        ),
      )
    : legalMoves;

  if (moves.length === 0) {
    return null;
  }

  if (difficulty === 'novice') {
    return toLegalMove(chooseRandom(moves, random));
  }

  if (difficulty === 'beginner') {
    const captures = moves.filter((move) => move.captured);
    return toLegalMove(
      chooseRandom(captures.length > 0 ? captures : moves, random),
    );
  }

  const aiColor = chess.turn();
  const scoredMoves = moves.map((move) => ({
    move,
    score: evaluateMove(chess, move, aiColor),
  }));
  const bestScore = Math.max(...scoredMoves.map(({ score }) => score));
  const bestMoves = scoredMoves
    .filter(({ score }) => score === bestScore)
    .map(({ move }) => move);

  return toLegalMove(chooseRandom(bestMoves, random));
}
