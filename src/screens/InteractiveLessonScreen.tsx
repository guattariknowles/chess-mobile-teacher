import type { Square } from 'chess.js';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { ChessBoard } from '../components/Board/ChessBoard';
import type { ChessLesson } from '../data/lessons/lessonCatalog';
import { ChessGame, type LegalMove } from '../game/chessState';
import {
  advanceLesson,
  attemptLessonMove,
  createLessonRuntime,
  getCurrentLessonStep,
  restartLesson,
  showLessonHint,
  undoLessonMove,
} from '../game/lessonRuntime';

type InteractiveLessonScreenProps = {
  lesson: ChessLesson;
  onBack: () => void;
};

export function InteractiveLessonScreen({
  lesson,
  onBack,
}: InteractiveLessonScreenProps) {
  const interactive = lesson.interactive;

  if (!interactive) {
    throw new Error(`${lesson.id}: 缺少互动课程数据`);
  }

  const [runtime, setRuntime] = useState(() =>
    createLessonRuntime(lesson),
  );
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(
    null,
  );
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [flipped, setFlipped] = useState(false);
  const { height, width } = useWindowDimensions();
  const snapshot = useMemo(
    () =>
      new ChessGame(runtime.fen, {
        allowMovesAfterGameOver: true,
      }).getSnapshot(),
    [runtime.fen],
  );
  const step = getCurrentLessonStep(lesson, runtime);
  const boardSize = Math.floor(
    Math.min(width - 24, Math.max(240, height * 0.43), 430),
  );
  const progress = runtime.completed
    ? interactive.steps.length
    : runtime.stepIndex + 1;
  const usesLocalAi = interactive.steps.some(
    (lessonStep) => lessonStep.opponent?.mode === 'local-ai',
  );
  const usesScript = interactive.steps.some(
    (lessonStep) => lessonStep.opponent?.mode === 'scripted',
  );

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleSquarePress = (square: Square) => {
    if (runtime.completed || runtime.awaitingAdvance) {
      clearSelection();
      return;
    }

    const game = new ChessGame(runtime.fen, {
      allowMovesAfterGameOver: true,
    });
    const piece = game.getPiece(square);

    if (!selectedSquare) {
      if (piece?.color === snapshot.status.turn) {
        setSelectedSquare(square);
        setLegalMoves(game.getLegalMoves(square));
      }
      return;
    }

    if (
      piece?.color === snapshot.status.turn &&
      square !== selectedSquare
    ) {
      setSelectedSquare(square);
      setLegalMoves(game.getLegalMoves(square));
      return;
    }

    const candidate = legalMoves.find((move) => move.to === square);
    setRuntime((current) =>
      attemptLessonMove(lesson, current, {
        from: selectedSquare,
        promotion: candidate?.promotion,
        to: square,
      }),
    );
    clearSelection();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>返回说明</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>互动练习 · {lesson.level}</Text>
            <Text style={styles.title}>{lesson.title}</Text>
            <Text style={styles.progress}>
              第 {progress} / {interactive.steps.length} 步 · 错误{' '}
              {runtime.errors} 次
            </Text>
          </View>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.cardLabel}>本课目标</Text>
          <Text style={styles.goalText}>{interactive.goal}</Text>
          <Text style={styles.modeText}>
            {usesLocalAi
              ? '当前对手：离线本地 AI；课程目标仍限制正确走法'
              : usesScript
                ? '当前对手：固定教学脚本'
                : '本课为单步走棋练习，不含对手回应'}
          </Text>
        </View>

        <View style={styles.boardWrap}>
          <ChessBoard
            board={snapshot.board}
            flipped={flipped}
            lastMove={snapshot.lastMove}
            legalMoves={legalMoves}
            onSquarePress={handleSquarePress}
            selectedSquare={selectedSquare}
            size={boardSize}
          />
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.cardLabel}>
            {runtime.completed ? '课程完成' : '当前任务'}
          </Text>
          <Text style={styles.instructionText}>
            {runtime.completed
              ? interactive.completion
              : step?.instruction}
          </Text>
        </View>

        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.feedbackCard,
            runtime.feedback.kind === 'error' && styles.errorCard,
            runtime.feedback.kind === 'correct' && styles.correctCard,
            runtime.feedback.kind === 'complete' && styles.completeCard,
            runtime.feedback.kind === 'hint' && styles.hintCard,
          ]}
        >
          <Text style={styles.feedbackText}>
            {runtime.feedback.message}
          </Text>
        </View>

        <View style={styles.controlRow}>
          <ControlButton
            label="提示"
            onPress={() =>
              setRuntime((current) => showLessonHint(lesson, current))
            }
          />
          <ControlButton
            disabled={runtime.history.length === 0}
            label="上一步"
            onPress={() => {
              setRuntime((current) => undoLessonMove(current));
              clearSelection();
            }}
          />
          <ControlButton
            label="重来"
            onPress={() => {
              setRuntime(restartLesson(lesson));
              clearSelection();
            }}
          />
          <ControlButton
            disabled={!runtime.awaitingAdvance}
            label="下一步"
            onPress={() => {
              setRuntime((current) => advanceLesson(lesson, current));
              clearSelection();
            }}
            primary
          />
        </View>

        <Pressable
          onPress={() => {
            setFlipped((value) => !value);
            clearSelection();
          }}
          style={styles.flipButton}
        >
          <Text style={styles.flipButtonText}>翻转互动棋盘</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ControlButton({
  disabled = false,
  label,
  onPress,
  primary = false,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.controlButton,
        primary && styles.primaryButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text
        style={[
          styles.controlButtonText,
          primary && styles.primaryButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boardWrap: { alignItems: 'center', paddingVertical: 12 },
  cardLabel: {
    color: '#d7a65c',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },
  completeCard: { borderColor: '#6f9d65' },
  content: { paddingBottom: 32 },
  controlButton: {
    alignItems: 'center',
    borderColor: '#515951',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  controlButtonText: {
    color: '#d7ddd4',
    fontSize: 11,
    fontWeight: '800',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 7,
    marginHorizontal: 12,
    marginTop: 10,
  },
  correctCard: { borderColor: '#657d58' },
  disabledButton: { opacity: 0.35 },
  errorCard: { borderColor: '#9b5a4b' },
  eyebrow: {
    color: '#d49a43',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  feedbackCard: {
    backgroundColor: '#222722',
    borderColor: '#3b433b',
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 9,
    minHeight: 58,
    padding: 11,
  },
  feedbackText: { color: '#d8ddd4', fontSize: 12, lineHeight: 18 },
  flipButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: '#4b544b',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  flipButtonText: { color: '#d6a45a', fontSize: 10, fontWeight: '800' },
  goalCard: {
    backgroundColor: '#242924',
    borderColor: '#3c443c',
    borderRadius: 11,
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 11,
  },
  goalText: { color: '#e1e6dd', fontSize: 13, lineHeight: 19 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 42,
  },
  headerText: { flex: 1, marginLeft: 12 },
  hintCard: { borderColor: '#97733a' },
  instructionCard: {
    backgroundColor: '#292e29',
    borderColor: '#4a534a',
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 12,
    padding: 11,
  },
  instructionText: { color: '#f0eee7', fontSize: 13, lineHeight: 19 },
  modeText: { color: '#8e978d', fontSize: 10, marginTop: 6 },
  outlineButton: {
    borderColor: '#424a42',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  outlineButtonText: { color: '#e5e2d9', fontSize: 10, fontWeight: '700' },
  primaryButton: { backgroundColor: '#7b572a', borderColor: '#d49a43' },
  primaryButtonText: { color: '#fff3df' },
  progress: { color: '#8f978e', fontSize: 10, marginTop: 2 },
  screen: { backgroundColor: '#171a18', flex: 1 },
  title: { color: '#f4f1e8', fontSize: 21, fontWeight: '900', marginTop: 2 },
});
