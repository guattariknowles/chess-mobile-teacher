import { Chess, type Color, type Move } from 'chess.js';

import {
  type ChessLesson,
  type InteractiveLessonMove,
  type LessonCategory,
  START_FEN,
} from '../data/lessons/lessonCatalog';

export type ImportTrainingCategory = Extract<
  LessonCategory,
  'classics' | 'endgames' | 'openings'
>;

export type ImportedTrainingRecord = {
  category: ImportTrainingCategory;
  createdAt: string;
  humanColor: Color;
  id: string;
  pgn: string;
  title: string;
  updatedAt: string;
};

export type ImportedTrainingInput = {
  category: ImportTrainingCategory;
  humanColor: Color;
  pgn: string;
  title: string;
};

const OPENING_MAX_PLIES = 12;

function toLessonMove(move: Move): InteractiveLessonMove {
  return {
    from: move.from,
    promotion:
      move.promotion as InteractiveLessonMove['promotion'],
    to: move.to,
  };
}

function parsePgn(pgn: string): {
  chess: Chess;
  moves: Move[];
  normalizedPgn: string;
  startFen: string;
} {
  const normalizedPgn = pgn.trim();

  if (!normalizedPgn) {
    throw new Error('PGN 内容不能为空');
  }

  const chess = new Chess();

  try {
    chess.loadPgn(normalizedPgn);
  } catch {
    throw new Error('无法读取 PGN，请检查格式和每一步是否合法');
  }

  const headers = chess.getHeaders();
  const startFen =
    headers.SetUp === '1' && headers.FEN ? headers.FEN : START_FEN;

  return {
    chess,
    moves: chess.history({ verbose: true }),
    normalizedPgn,
    startFen,
  };
}

function buildLineLesson(
  record: ImportedTrainingRecord,
  moves: Move[],
): ChessLesson {
  const isOpening = record.category === 'openings';
  const lineMoves = isOpening
    ? moves.slice(0, OPENING_MAX_PLIES)
    : moves;
  const firstHumanIndex = record.humanColor === 'w' ? 0 : 1;
  const humanMoves = lineMoves.filter(
    (_, index) => index % 2 === firstHumanIndex,
  );

  if (humanMoves.length === 0) {
    throw new Error(
      record.humanColor === 'w'
        ? '棋谱中没有可供白方训练的走法'
        : '棋谱中没有可供黑方训练的走法',
    );
  }

  const firstMove = humanMoves[0];
  const initialOpponent =
    record.humanColor === 'b' && lineMoves[0]
      ? {
          allowedMoves: [toLessonMove(lineMoves[0])],
          difficulty: 'intermediate' as const,
          mode: 'local-ai' as const,
        }
      : undefined;
  const steps = lineMoves.flatMap((move, index) => {
    if (index % 2 !== firstHumanIndex) {
      return [];
    }

    const response = lineMoves[index + 1];

    return [
      {
        acceptedMoves: [toLessonMove(move)],
        explanation: `正确，棋谱着法是 ${move.san}。`,
        hint: `寻找棋谱中的 ${move.san}。`,
        id: `imported-ply-${index + 1}`,
        incorrectFeedback: `这一步与导入棋谱不一致，请寻找 ${move.san}。`,
        instruction: `请走出导入棋谱的 ${move.san}。`,
        opponent: response
          ? {
              allowedMoves: [toLessonMove(response)],
              difficulty: 'intermediate' as const,
              mode: 'local-ai' as const,
            }
          : undefined,
      },
    ];
  });
  const modeText = isOpening
    ? '前 6 个完整回合按棋谱训练，之后转为自由 AI 对弈。'
    : '双方严格按照导入棋谱复现整盘对局。';

  return {
    category: record.category,
    fen: START_FEN,
    id: record.id,
    interactive: {
      completion: isOpening
        ? '开局训练与后续自由对弈已经结束。'
        : '你已经按导入棋谱完成经典对局训练。',
      freePlay: isOpening
        ? {
            difficulty: 'intermediate',
          }
        : undefined,
      goal: modeText,
      humanColor: record.humanColor,
      initialOpponent,
      intro: `训练${record.humanColor === 'w' ? '白方' : '黑方'}。${modeText}`,
      startFen: START_FEN,
      steps,
    },
    level: '进阶',
    mistake: {
      explanation: '偏离导入棋谱后，本轮会提示正确的目标着法。',
      label: '偏离棋谱',
    },
    points: [
      modeText,
      'AI 回应来自导入棋谱或当前离线 AI。',
      'Stockfish 接入后，自由回应会由 Stockfish 负责。',
    ],
    recommended: {
      explanation: `导入棋谱中需要你走出的第一步是 ${firstMove.san}。`,
      from: firstMove.from,
      label: firstMove.san,
      promotion:
        firstMove.promotion as InteractiveLessonMove['promotion'],
      to: firstMove.to,
    },
    summary: modeText,
    title: record.title,
    training: {
      format: record.category === 'classics' ? 'classic-game' : 'guided',
      objectives: [modeText],
      source: 'imported',
      standardStart: true,
      tags: ['PGN 导入', record.category, record.humanColor],
    },
    why: '把自己选择的棋谱变成可重复走棋的本地训练。',
  };
}

function buildEndgameLesson(
  record: ImportedTrainingRecord,
  chess: Chess,
  moves: Move[],
): ChessLesson {
  let startFen = chess.fen();
  let position = new Chess(startFen);

  if (position.isGameOver() && moves.length > 0) {
    startFen = moves[moves.length - 1].before;
    position = new Chess(startFen);
  }

  if (position.isGameOver()) {
    throw new Error('导入棋谱没有可继续训练的残局局面');
  }

  const humanColor = position.turn();

  return {
    category: 'endgames',
    fen: startFen,
    id: record.id,
    interactive: {
      completion: '本次残局自由对弈已经结束。',
      freePlay: {
        difficulty: 'intermediate',
      },
      goal: '从导入棋谱的末端局面开始，与 AI 直接完成残局。',
      humanColor,
      intro: `残局由 AI 自主处理。当前由你执${humanColor === 'w' ? '白' : '黑'}，轮到你走。`,
      startFen,
      steps: [],
    },
    level: '进阶',
    points: [
      '导入棋谱只用于确定残局起点。',
      'AI 不复现后续棋谱，而是根据当前局面自主选择合法走法。',
      'Stockfish 接入后将由 Stockfish 负责残局回应。',
    ],
    summary: '从导入棋谱末端的可继续局面直接进行残局对弈。',
    title: record.title,
    training: {
      format: 'challenge',
      objectives: ['从导入局面完成残局对弈'],
      source: 'imported',
      standardStart: startFen === START_FEN,
      tags: ['PGN 导入', '残局', '自由 AI'],
    },
    why: '残局需要根据实际局面计算，AI 自主回应比背诵固定棋谱更接近实战。',
  };
}

export function createImportedTrainingRecord(
  input: ImportedTrainingInput,
): ImportedTrainingRecord {
  const parsed = parsePgn(input.pgn);

  if (
    input.category !== 'endgames' &&
    parsed.startFen !== START_FEN
  ) {
    throw new Error('开局和经典对局训练必须从标准初始局面开始');
  }

  const now = new Date().toISOString();
  const title = input.title.trim();

  if (!title) {
    throw new Error('请输入训练名称');
  }

  const record: ImportedTrainingRecord = {
    category: input.category,
    createdAt: now,
    humanColor: input.humanColor,
    id: `training-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pgn: parsed.normalizedPgn,
    title,
    updatedAt: now,
  };

  createLessonFromImportedTraining(record);
  return record;
}

export function createLessonFromImportedTraining(
  record: ImportedTrainingRecord,
): ChessLesson {
  const parsed = parsePgn(record.pgn);

  return record.category === 'endgames'
    ? buildEndgameLesson(record, parsed.chess, parsed.moves)
    : buildLineLesson(record, parsed.moves);
}

export function isImportedTrainingRecord(
  value: unknown,
): value is ImportedTrainingRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<ImportedTrainingRecord>;

  return (
    (record.category === 'openings' ||
      record.category === 'classics' ||
      record.category === 'endgames') &&
    (record.humanColor === 'w' || record.humanColor === 'b') &&
    typeof record.createdAt === 'string' &&
    typeof record.id === 'string' &&
    typeof record.pgn === 'string' &&
    typeof record.title === 'string' &&
    typeof record.updatedAt === 'string'
  );
}
