import { Chess, type Color, type Square } from 'chess.js';

export type LessonCategory =
  | 'basics'
  | 'openings'
  | 'classics'
  | 'strategy'
  | 'endgames';

export type InteractiveLessonMove = {
  from: Square;
  promotion?: 'b' | 'n' | 'q' | 'r';
  to: Square;
};

export type InteractiveLessonOpponent = {
  allowedMoves?: InteractiveLessonMove[];
  difficulty: 'novice' | 'beginner' | 'intermediate';
  mode: 'local-ai' | 'scripted';
};

export type InteractiveLessonStep = {
  acceptedMoves: InteractiveLessonMove[];
  explanation: string;
  hint: string;
  id: string;
  incorrectFeedback: string;
  instruction: string;
  opponent?: InteractiveLessonOpponent;
  transition?: {
    fen: string;
    message: string;
  };
};

export type InteractiveLesson = {
  completion: string;
  freePlay?: {
    difficulty: InteractiveLessonOpponent['difficulty'];
  };
  goal: string;
  humanColor?: Color;
  initialOpponent?: InteractiveLessonOpponent;
  intro: string;
  startFen: string;
  steps: InteractiveLessonStep[];
};

export type LessonTrainingData = {
  format: 'challenge' | 'classic-game' | 'guided';
  objectives: string[];
  source: 'built-in' | 'imported';
  standardStart: boolean;
  tags: string[];
};

export type ChessLesson = {
  category: LessonCategory;
  fen: string;
  historical?: {
    event: string;
    players: string;
    year: number;
  };
  id: string;
  interactive?: InteractiveLesson;
  level: '入门' | '基础' | '进阶';
  mistake?: { explanation: string; label: string };
  points: string[];
  recommended?: {
    explanation: string;
    from: Square;
    label: string;
    promotion?: 'b' | 'n' | 'q' | 'r';
    to: Square;
  };
  summary: string;
  title: string;
  training: LessonTrainingData;
  why: string;
};

type LessonDefinition = Omit<ChessLesson, 'training'> & {
  training?: Partial<Omit<LessonTrainingData, 'standardStart'>>;
};

export const LESSON_CATEGORY_LABELS: Record<LessonCategory, string> = {
  basics: '规则基础',
  openings: '常见开局',
  classics: '经典名局',
  strategy: '中局思路',
  endgames: '残局基础',
};

export const START_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type GuidedLineStep = {
  explanation: string;
  from: Square;
  hint: string;
  id: string;
  instruction: string;
  response?: InteractiveLessonMove;
  to: Square;
};

function createLineInteractive({
  completion,
  goal,
  intro,
  steps,
}: {
  completion: string;
  goal: string;
  intro: string;
  steps: GuidedLineStep[];
}): InteractiveLesson {
  return {
    completion,
    goal,
    intro,
    startFen: START_FEN,
    steps: steps.map((step) => ({
      acceptedMoves: [{ from: step.from, to: step.to }],
      explanation: step.explanation,
      hint: step.hint,
      id: step.id,
      incorrectFeedback: `这一步还没有完成当前目标。${step.hint}`,
      instruction: step.instruction,
      opponent: step.response
        ? {
            allowedMoves: [step.response],
            difficulty: 'intermediate',
            mode: 'local-ai',
          }
        : undefined,
    })),
  };
}

function createFoundationSteps(): InteractiveLessonStep[] {
  return createLineInteractive({
    completion: '',
    goal: '',
    intro: '',
    steps: [
      {
        explanation: 'e4 争夺中心，并打开后和王翼象的线路。',
        from: 'e2',
        hint: '把 e2 兵走到 e4。',
        id: 'foundation-center',
        instruction: '基础开局第一步：用王前兵争夺中心。',
        response: { from: 'e7', to: 'e5' },
        to: 'e4',
      },
      {
        explanation: 'Nf3 发展马，并攻击黑方 e5 兵。',
        from: 'g1',
        hint: '把 g1 的马发展到 f3。',
        id: 'foundation-knight',
        instruction: '基础开局第二步：发展王翼马。',
        response: { from: 'b8', to: 'c6' },
        to: 'f3',
      },
      {
        explanation: 'Bc4 发展象，并关注黑方较薄弱的 f7。',
        from: 'f1',
        hint: '把 f1 的象发展到 c4。',
        id: 'foundation-bishop',
        instruction: '基础开局第三步：发展王翼象。',
        response: { from: 'g8', to: 'f6' },
        to: 'c4',
      },
    ],
  }).steps;
}

const ITALIAN_INTERACTIVE: InteractiveLesson = {
  completion:
    '你已经走出意大利开局的代表性前三步，并理解了占中心、发展马和发展象的顺序。',
  goal: '走出 1.e4 e5 2.Nf3 Nc6 3.Bc4。',
  intro: '由你执白。黑方按固定主线回应，方便反复练习同一套发展思路。',
  startFen: START_FEN,
  steps: [
    {
      acceptedMoves: [{ from: 'e2', to: 'e4' }],
      explanation: 'e4 占据中心，同时打开后和 f1 象的线路。',
      hint: '选择 e2 白兵，把它走到 e4。',
      id: 'claim-center',
      incorrectFeedback: '先用 e 兵占据中心，不要急着移动边兵或后。',
      instruction: '第一步：用兵占据中心，并打开王翼象的线路。',
      opponent: {
        allowedMoves: [{ from: 'e7', to: 'e5' }],
        difficulty: 'intermediate',
        mode: 'local-ai',
      },
    },
    {
      acceptedMoves: [{ from: 'g1', to: 'f3' }],
      explanation: 'Nf3 发展王翼马，并直接攻击黑方 e5 兵。',
      hint: '选择 g1 的马，寻找能攻击 e5 的发展格。',
      id: 'develop-knight',
      incorrectFeedback: '这一步应先发展王翼马，并给 e5 兵施加压力。',
      instruction: '第二步：发展一个棋子，同时攻击黑方中心兵。',
      opponent: {
        allowedMoves: [{ from: 'b8', to: 'c6' }],
        difficulty: 'intermediate',
        mode: 'local-ai',
      },
    },
    {
      acceptedMoves: [{ from: 'f1', to: 'c4' }],
      explanation: 'Bc4 发展象、协助控制中心，并把目光放到较薄弱的 f7。',
      hint: '把 f1 的象放到一条能看向 f7 的斜线上。',
      id: 'develop-bishop',
      incorrectFeedback: '目标是发展王翼象，并让它对准 f7。',
      instruction: '第三步：发展王翼象，并关注黑方 f7。',
    },
  ],
};

const CENTER_INTERACTIVE: InteractiveLesson = {
  completion:
    '你完成了中心计划选择：用中心兵争取空间，再观察对手的发展。',
  goal: '选择一个能立即争夺中心的首步。',
  intro:
    '这是候选着法练习。e4 和 d4 都符合目标；黑方会从课程允许的回应中调用本地 AI。',
  startFen: START_FEN,
  steps: [
    {
      acceptedMoves: [
        { from: 'e2', to: 'e4' },
        { from: 'd2', to: 'd4' },
      ],
      explanation: '正确。中心兵前进既争取空间，也为后方棋子打开线路。',
      hint: '考虑 e 兵或 d 兵前进两格。',
      id: 'choose-center-plan',
      incorrectFeedback: '这一步没有直接争夺中心。请比较 e4 和 d4 的作用。',
      instruction: '从候选着法中选择一个能立即争夺中心的计划。',
      opponent: {
        allowedMoves: [{ from: 'g8', to: 'f6' }],
        difficulty: 'intermediate',
        mode: 'local-ai',
      },
    },
  ],
};

const KING_PAWN_INTERACTIVE: InteractiveLesson = {
  completion:
    '你先让王占据关键格，再推进兵；这比立即推兵保留了更多胜棋机会。',
  goal: '先改善王的位置，再推进通路兵。',
  intro:
    '由你执白。黑方回应由本地 AI 在课程限定的合法走法中选择，避免偏离本课目标。',
  startFen: '8/4k3/8/4K3/4P3/8/8/8 w - - 0 1',
  steps: [
    {
      acceptedMoves: [{ from: 'e5', to: 'd5' }],
      explanation: 'Kd5 让白王走到兵的前方，争夺更重要的关键格。',
      hint: '先移动白王，不要立刻推 e 兵。',
      id: 'activate-king',
      incorrectFeedback: '残局中王是主动棋子。先让王走到兵的前方。',
      instruction: '第一步：让白王占据兵前方的关键格。',
      opponent: {
        allowedMoves: [
          { from: 'e7', to: 'd7' },
          { from: 'e7', to: 'f7' },
        ],
        difficulty: 'beginner',
        mode: 'local-ai',
      },
    },
    {
      acceptedMoves: [{ from: 'e4', to: 'e5' }],
      explanation: '现在推进 e5，白王仍在前方保护通路兵。',
      hint: '王的位置改善后，可以推进 e4 的兵。',
      id: 'advance-pawn',
      incorrectFeedback: '保持王在前方，当前目标是把 e4 兵向前推进一格。',
      instruction: '第二步：在王的保护下推进通路兵。',
    },
  ],
};

const RUY_LOPEZ_INTERACTIVE = createLineInteractive({
  completion: '你从标准初始局面走出了西班牙开局，并理解了 Bb5 的牵制目标。',
  goal: '走出 1.e4 e5 2.Nf3 Nc6 3.Bb5。',
  intro: '由你执白，离线 AI 按西班牙开局的基础主线回应。',
  steps: [
    {
      explanation: 'e4 先争夺中心。',
      from: 'e2',
      hint: '先走王前兵两格。',
      id: 'ruy-center',
      instruction: '先占据中心并打开王翼象。',
      response: { from: 'e7', to: 'e5' },
      to: 'e4',
    },
    {
      explanation: 'Nf3 发展马并攻击 e5。',
      from: 'g1',
      hint: '发展能攻击 e5 的马。',
      id: 'ruy-knight',
      instruction: '发展王翼马，给黑方中心施压。',
      response: { from: 'b8', to: 'c6' },
      to: 'f3',
    },
    {
      explanation: 'Bb5 牵制 c6 马，间接增加 e5 兵的防守压力。',
      from: 'f1',
      hint: '把 f1 象放到 b5。',
      id: 'ruy-pin',
      instruction: '用象牵制保护 e5 的 c6 马。',
      to: 'b5',
    },
  ],
});

const QUEENS_GAMBIT_INTERACTIVE = createLineInteractive({
  completion: '你从初始局面用 c 兵挑战了黑方 d5 中心兵。',
  goal: '走出 1.d4 d5 2.c4。',
  intro: '由你执白，离线 AI 配合展示后翼弃兵的基本结构。',
  steps: [
    {
      explanation: 'd4 占据中心，并为 c4 的侧面挑战做准备。',
      from: 'd2',
      hint: '先把 d2 兵走到 d4。',
      id: 'qg-center',
      instruction: '先用后前兵占据中心。',
      response: { from: 'd7', to: 'd5' },
      to: 'd4',
    },
    {
      explanation: 'c4 用侧翼兵直接挑战黑方的中心兵。',
      from: 'c2',
      hint: '用 c2 兵攻击 d5。',
      id: 'qg-challenge',
      instruction: '现在用侧翼兵挑战黑方中心。',
      to: 'c4',
    },
  ],
});

const LONDON_INTERACTIVE = createLineInteractive({
  completion: '你从标准初始局面完成了伦敦体系最有代表性的三步布局。',
  goal: '走出 1.d4 d5 2.Nf3 Nf6 3.Bf4。',
  intro: '由你执白，离线 AI 帮你练习伦敦体系的基础出子顺序。',
  steps: [
    {
      explanation: 'd4 建立中心立足点。',
      from: 'd2',
      hint: '先走 d 兵两格。',
      id: 'london-center',
      instruction: '先建立后兵中心。',
      response: { from: 'd7', to: 'd5' },
      to: 'd4',
    },
    {
      explanation: 'Nf3 发展马并支持中心。',
      from: 'g1',
      hint: '把 g1 马发展到 f3。',
      id: 'london-knight',
      instruction: '发展王翼马。',
      response: { from: 'g8', to: 'f6' },
      to: 'f3',
    },
    {
      explanation: 'Bf4 先把后翼象发展到兵链外面。',
      from: 'c1',
      hint: '把 c1 象走到 f4。',
      id: 'london-bishop',
      instruction: '在走 e3 前先发展后翼象。',
      to: 'f4',
    },
  ],
});

const SICILIAN_INTERACTIVE = createLineInteractive({
  completion: '你从初始局面进入西西里防御，并用 Nf3 为 d4 做准备。',
  goal: '走出 1.e4 c5 2.Nf3。',
  intro: '离线 AI 执黑选择西西里防御，你练习白方的基础应对。',
  steps: [
    {
      explanation: 'e4 占据中心；黑方用 c5 从侧面反击。',
      from: 'e2',
      hint: '先走 e2-e4。',
      id: 'sicilian-center',
      instruction: '用王前兵占据中心。',
      response: { from: 'c7', to: 'c5' },
      to: 'e4',
    },
    {
      explanation: 'Nf3 发展马，并为下一步 d4 打开准备。',
      from: 'g1',
      hint: '把 g1 马发展到 f3。',
      id: 'sicilian-develop',
      instruction: '发展马，为打开中心做准备。',
      to: 'f3',
    },
  ],
});

const FRENCH_INTERACTIVE = createLineInteractive({
  completion: '你从初始局面建立了应对法兰西防御的双兵中心。',
  goal: '走出 1.e4 e6 2.d4。',
  intro: '离线 AI 执黑选择法兰西防御，你练习白方建立中心。',
  steps: [
    {
      explanation: 'e4 先占中心；黑方用 e6 准备 ...d5。',
      from: 'e2',
      hint: '先走 e2-e4。',
      id: 'french-center',
      instruction: '先占据 e4。',
      response: { from: 'e7', to: 'e6' },
      to: 'e4',
    },
    {
      explanation: 'd4 建立双兵中心，并准备正面应对 ...d5。',
      from: 'd2',
      hint: '把 d2 兵走到 d4。',
      id: 'french-space',
      instruction: '用另一个中心兵扩大空间。',
      to: 'd4',
    },
  ],
});

const SCOTCH_INTERACTIVE = createLineInteractive({
  completion: '你走出了苏格兰开局，用 d4 立即打开中心。',
  goal: '走出 1.e4 e5 2.Nf3 Nc6 3.d4。',
  intro: '这是阶段 8 的开局挑战。你执白，离线 AI 按主线回应。',
  steps: [
    {
      explanation: 'e4 争夺中心。',
      from: 'e2',
      hint: '走 e2-e4。',
      id: 'scotch-center',
      instruction: '先占据中心。',
      response: { from: 'e7', to: 'e5' },
      to: 'e4',
    },
    {
      explanation: 'Nf3 发展马并攻击 e5。',
      from: 'g1',
      hint: '把 g1 马走到 f3。',
      id: 'scotch-knight',
      instruction: '发展马并攻击中心兵。',
      response: { from: 'b8', to: 'c6' },
      to: 'f3',
    },
    {
      explanation: 'd4 立即挑战 e5，让中心尽早打开。',
      from: 'd2',
      hint: '用 d2 兵攻击 e5。',
      id: 'scotch-break',
      instruction: '现在用 d 兵打开中心。',
      to: 'd4',
    },
  ],
});

const CARO_KANN_INTERACTIVE = createLineInteractive({
  completion: '你建立了应对卡罗-康防御的中心，并自然发展后翼马。',
  goal: '走出 1.e4 c6 2.d4 d5 3.Nc3。',
  intro: '离线 AI 执黑选择卡罗-康防御，你练习白方的基础中心布局。',
  steps: [
    {
      explanation: 'e4 先占中心；黑方 c6 准备 ...d5。',
      from: 'e2',
      hint: '走 e2-e4。',
      id: 'caro-center',
      instruction: '先占据 e4。',
      response: { from: 'c7', to: 'c6' },
      to: 'e4',
    },
    {
      explanation: 'd4 建立双兵中心。',
      from: 'd2',
      hint: '走 d2-d4。',
      id: 'caro-space',
      instruction: '建立第二个中心兵。',
      response: { from: 'd7', to: 'd5' },
      to: 'd4',
    },
    {
      explanation: 'Nc3 发展马并加强 e4。',
      from: 'b1',
      hint: '把 b1 马走到 c3。',
      id: 'caro-develop',
      instruction: '发展后翼马并保护中心。',
      to: 'c3',
    },
  ],
});

const KINGS_INDIAN_INTERACTIVE = createLineInteractive({
  completion: '你从初始局面建立了古典中心，黑方完成了王翼印度式布局。',
  goal: '走出 1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4。',
  intro: '离线 AI 展示王翼印度防御的基本布置，你负责建立白方中心。',
  steps: [
    {
      explanation: 'd4 先占据中心。',
      from: 'd2',
      hint: '走 d2-d4。',
      id: 'kid-d4',
      instruction: '先走后前兵。',
      response: { from: 'g8', to: 'f6' },
      to: 'd4',
    },
    {
      explanation: 'c4 扩大后翼和中心空间。',
      from: 'c2',
      hint: '走 c2-c4。',
      id: 'kid-c4',
      instruction: '用 c 兵扩大中心控制。',
      response: { from: 'g7', to: 'g6' },
      to: 'c4',
    },
    {
      explanation: 'Nc3 发展马并支持 d5、e4。',
      from: 'b1',
      hint: '把 b1 马走到 c3。',
      id: 'kid-knight',
      instruction: '发展后翼马。',
      response: { from: 'f8', to: 'g7' },
      to: 'c3',
    },
    {
      explanation: 'e4 建立宽阔兵中心，准备继续发展和保护王。',
      from: 'e2',
      hint: '把 e2 兵走到 e4。',
      id: 'kid-e4',
      instruction: '完成白方古典中心。',
      to: 'e4',
    },
  ],
});

const OPERA_GAME_INTERACTIVE = createLineInteractive({
  completion: '你复现了歌剧院名局的前六回合，重点是快速打开中心并让棋子参与进攻。',
  goal: '复现莫菲在 1858 年歌剧院名局中的前六步白棋。',
  intro: '棋谱走法属于公开历史事实；讲解为本项目原创。离线 AI 执黑复现对手走法。',
  steps: [
    {
      explanation: 'e4 争夺中心并打开线路。',
      from: 'e2',
      hint: '走 e2-e4。',
      id: 'opera-e4',
      instruction: '莫菲先占据中心。',
      response: { from: 'e7', to: 'e5' },
      to: 'e4',
    },
    {
      explanation: 'Nf3 发展马并攻击 e5。',
      from: 'g1',
      hint: '走 g1-f3。',
      id: 'opera-nf3',
      instruction: '发展马并制造压力。',
      response: { from: 'd7', to: 'd6' },
      to: 'f3',
    },
    {
      explanation: 'd4 直接打开中心，利用出子速度。',
      from: 'd2',
      hint: '走 d2-d4。',
      id: 'opera-d4',
      instruction: '用 d 兵挑战黑方中心。',
      response: { from: 'c8', to: 'g4' },
      to: 'd4',
    },
    {
      explanation: 'dxe5 先处理中心张力。',
      from: 'd4',
      hint: '用 d4 兵吃 e5 兵。',
      id: 'opera-dxe5',
      instruction: '交换黑方中心兵。',
      response: { from: 'g4', to: 'f3' },
      to: 'e5',
    },
    {
      explanation: 'Qxf3 用后取回被吃的马，保持发展节奏。',
      from: 'd1',
      hint: '用 d1 后吃 f3 的象。',
      id: 'opera-qxf3',
      instruction: '取回 f3 的黑象。',
      response: { from: 'd6', to: 'e5' },
      to: 'f3',
    },
    {
      explanation: 'Bc4 发展最后一枚王翼轻子，并对 f7 施压。',
      from: 'f1',
      hint: '把 f1 象发展到 c4。',
      id: 'opera-bc4',
      instruction: '继续发展，不急着用后吃边兵。',
      to: 'c4',
    },
  ],
});

const EVERGREEN_GAME_INTERACTIVE = createLineInteractive({
  completion: '你复现了常青树名局的开局片段，看到弃兵如何换取出子时间。',
  goal: '复现安德森在 1852 年常青树名局中的前六步白棋。',
  intro: '离线 AI 复现公开棋谱中的黑方走法；本课只讲开局发展主题。',
  steps: [
    {
      explanation: 'e4 打开快速出子的道路。',
      from: 'e2',
      hint: '走 e2-e4。',
      id: 'evergreen-e4',
      instruction: '先占据中心。',
      response: { from: 'e7', to: 'e5' },
      to: 'e4',
    },
    {
      explanation: 'Nf3 发展马并攻击 e5。',
      from: 'g1',
      hint: '走 g1-f3。',
      id: 'evergreen-nf3',
      instruction: '发展王翼马。',
      response: { from: 'b8', to: 'c6' },
      to: 'f3',
    },
    {
      explanation: 'Bc4 发展象并关注 f7。',
      from: 'f1',
      hint: '走 f1-c4。',
      id: 'evergreen-bc4',
      instruction: '发展王翼象。',
      response: { from: 'f8', to: 'c5' },
      to: 'c4',
    },
    {
      explanation: 'b4 是伊文斯弃兵，用一个兵换取发展时间。',
      from: 'b2',
      hint: '走 b2-b4。',
      id: 'evergreen-b4',
      instruction: '用 b 兵攻击 c5 象。',
      response: { from: 'c5', to: 'b4' },
      to: 'b4',
    },
    {
      explanation: 'c3 追赶黑象，并准备 d4 建立中心。',
      from: 'c2',
      hint: '走 c2-c3。',
      id: 'evergreen-c3',
      instruction: '继续用兵获得出子时间。',
      response: { from: 'b4', to: 'a5' },
      to: 'c3',
    },
    {
      explanation: 'd4 建立中心，让更多棋子和线路投入进攻。',
      from: 'd2',
      hint: '走 d2-d4。',
      id: 'evergreen-d4',
      instruction: '利用领先的发展打开中心。',
      to: 'd4',
    },
  ],
});

const IMMORTAL_GAME_INTERACTIVE = createLineInteractive({
  completion: '你复现了不朽对局的开局片段，并看到浪漫主义棋风愿意用兵换主动。',
  goal: '复现安德森在 1851 年不朽对局中的前五步白棋。',
  intro: '这是历史棋谱复现，不表示这些冒险走法适合所有实战。离线 AI 复现黑方应手。',
  steps: [
    {
      explanation: 'e4 打开中心。',
      from: 'e2',
      hint: '走 e2-e4。',
      id: 'immortal-e4',
      instruction: '先占据中心。',
      response: { from: 'e7', to: 'e5' },
      to: 'e4',
    },
    {
      explanation: 'f4 是王翼弃兵，用兵换取开放线路和时间。',
      from: 'f2',
      hint: '走 f2-f4。',
      id: 'immortal-f4',
      instruction: '走出王翼弃兵。',
      response: { from: 'e5', to: 'f4' },
      to: 'f4',
    },
    {
      explanation: 'Bc4 发展象并瞄准 f7。',
      from: 'f1',
      hint: '走 f1-c4。',
      id: 'immortal-bc4',
      instruction: '继续发展棋子。',
      response: { from: 'd8', to: 'h4' },
      to: 'c4',
    },
    {
      explanation: 'Kf1 应对将军，但白方因此失去易位权。',
      from: 'e1',
      hint: '把王从 e1 走到 f1。',
      id: 'immortal-kf1',
      instruction: '先解除黑后的将军。',
      response: { from: 'b7', to: 'b5' },
      to: 'f1',
    },
    {
      explanation: 'Bxb5 接受反弃兵，同时保留对中心和王翼的压力。',
      from: 'c4',
      hint: '用 c4 象吃 b5 兵。',
      id: 'immortal-bxb5',
      instruction: '处理攻击 c4 象的 b5 兵。',
      to: 'b5',
    },
  ],
});

const DEVELOPMENT_CHALLENGE_INTERACTIVE = createLineInteractive({
  completion: '你完成了占中心、发展两枚轻子和王车易位的基础开局清单。',
  goal: '用连续对弈完成 e4、Nf3、Bc4 和 O-O。',
  intro: '这是阶段 8 的基础开局挑战。离线 AI 会给出受限合法回应。',
  steps: [
    ...createFoundationSteps().map((step) => ({
      explanation: step.explanation,
      from: step.acceptedMoves[0].from,
      hint: step.hint,
      id: `challenge-${step.id}`,
      instruction: step.instruction,
      response: step.opponent?.allowedMoves?.[0],
      to: step.acceptedMoves[0].to,
    })),
    {
      explanation: 'O-O 让王离开中央，并让 h1 车进入 f1。',
      from: 'e1',
      hint: '点击 e1 的王，再走到 g1。',
      id: 'challenge-castle',
      instruction: '完成王翼易位，保护王。',
      to: 'g1',
    },
  ],
});

const CHECKMATE_INTERACTIVE = createLineInteractive({
  completion: '你从标准初始局面完成了将死：黑王被攻击，而且没有合法解围方法。',
  goal: '走出基础四步将杀，理解将死与普通将军的区别。',
  intro: '离线 AI 按课程限定走法回应。这个短局用于认识将死，不代表最佳开局。',
  steps: [
    {
      explanation: 'e4 打开后和象的线路。',
      from: 'e2',
      hint: '走 e2-e4。',
      id: 'mate-e4',
      instruction: '先打开王翼象和后的线路。',
      response: { from: 'e7', to: 'e5' },
      to: 'e4',
    },
    {
      explanation: 'Bc4 瞄准只有黑王保护的 f7。',
      from: 'f1',
      hint: '把 f1 象走到 c4。',
      id: 'mate-bc4',
      instruction: '发展象并瞄准 f7。',
      response: { from: 'b8', to: 'c6' },
      to: 'c4',
    },
    {
      explanation: 'Qh5 与象一起攻击 f7。',
      from: 'd1',
      hint: '把后走到 h5。',
      id: 'mate-qh5',
      instruction: '让后与象共同攻击 f7。',
      response: { from: 'g8', to: 'f6' },
      to: 'h5',
    },
    {
      explanation: 'Qxf7# 是将死，黑王无法吃后、逃走或挡住攻击。',
      from: 'h5',
      hint: '用后吃掉 f7 兵。',
      id: 'mate-qxf7',
      instruction: '在 f7 完成将死。',
      to: 'f7',
    },
  ],
});

const STANDARD_START_INTERACTIONS: Record<string, InteractiveLesson> = {
  'challenge-development': DEVELOPMENT_CHALLENGE_INTERACTIVE,
  'classic-evergreen': EVERGREEN_GAME_INTERACTIVE,
  'classic-immortal': IMMORTAL_GAME_INTERACTIVE,
  'classic-opera-game': OPERA_GAME_INTERACTIVE,
  checkmate: CHECKMATE_INTERACTIVE,
  'opening-caro-kann': CARO_KANN_INTERACTIVE,
  'opening-french': FRENCH_INTERACTIVE,
  'opening-kings-indian': KINGS_INDIAN_INTERACTIVE,
  'opening-london': LONDON_INTERACTIVE,
  'opening-queens-gambit': QUEENS_GAMBIT_INTERACTIVE,
  'opening-ruy-lopez': RUY_LOPEZ_INTERACTIVE,
  'opening-scotch': SCOTCH_INTERACTIVE,
  'opening-sicilian': SICILIAN_INTERACTIVE,
};

const LESSON_CATALOG: LessonDefinition[] = [
  {
    category: 'basics',
    fen: START_FEN,
    id: 'board-coordinates',
    level: '入门',
    points: ['竖线用 a 到 h，横线用 1 到 8。', '先读字母再读数字，例如 e4。', '棋盘翻转后格子名称不变。'],
    summary: '学会读出 e4、a1 这样的格子名称。',
    title: '棋盘坐标',
    why: '坐标是记录走法、阅读 PGN 和讨论局面的共同语言。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/3K4/8/8/8/8 w - - 0 1',
    id: 'piece-king',
    level: '入门',
    points: ['王每次向任意方向走一格。', '王不能走进受攻击的格子。', '两个王不能相邻。'],
    recommended: { explanation: 'Kc5 展示王向左移动一格。', from: 'd5', label: 'Kc5', to: 'c5' },
    summary: '王走得慢，但王被将死就会输掉对局。',
    title: '王怎么走',
    why: '王是唯一不能放弃的棋子，所有计划都要先保证王的安全。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1',
    id: 'piece-queen',
    level: '入门',
    points: ['后能沿横线、竖线和斜线走任意格。', '后不能越过其他棋子。', '过早深入敌阵容易被追赶。'],
    recommended: { explanation: 'Qd7+ 同时展示直线移动和将军。', from: 'd4', label: 'Qd7+', to: 'd7' },
    summary: '后结合了车和象的走法。',
    title: '后怎么走',
    why: '后价值很高，安全使用比急着进攻更重要。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/8/3R4/8/8/4K3 w - - 0 1',
    id: 'piece-rook',
    level: '入门',
    points: ['车沿横线或竖线走任意格。', '车不能斜走或越子。', '开放的直线越多，车越活跃。'],
    recommended: { explanation: 'Rd8+ 沿竖线移动并将军。', from: 'd4', label: 'Rd8+', to: 'd8' },
    summary: '车擅长控制开放线和最后几排。',
    title: '车怎么走',
    why: '车在残局尤其强，但需要没有棋子阻挡的直线。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/8/3B4/8/8/4K3 w - - 0 1',
    id: 'piece-bishop',
    level: '入门',
    points: ['象只能沿斜线走任意格。', '一只象始终留在同色格。', '中心兵移开后象才容易出动。'],
    recommended: { explanation: 'Bb6 展示象沿斜线移动。', from: 'd4', label: 'Bb6', to: 'b6' },
    summary: '象是远距离棋子，需要畅通的斜线。',
    title: '象怎么走',
    why: '被自己的兵堵住时，象很难发挥作用。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/8/3N4/8/8/4K3 w - - 0 1',
    id: 'piece-knight',
    level: '入门',
    points: ['马走“日”字。', '马是唯一能越子的棋子。', '马在中心通常能控制更多格。'],
    recommended: { explanation: 'Nf5 是从 d4 出发的一次标准马步。', from: 'd4', label: 'Nf5', to: 'f5' },
    summary: '马的路线特殊，适合制造双重攻击。',
    title: '马怎么走',
    why: '马不能远距离移动，所以位置是否靠近战场很重要。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
    id: 'piece-pawn',
    level: '入门',
    points: ['兵向前走，第一次可走一格或两格。', '兵斜着吃子，不能向前吃子。', '兵不能后退。'],
    recommended: { explanation: 'e4 利用兵第一次可前进两格的规则。', from: 'e2', label: 'e4', to: 'e4' },
    summary: '兵走得最慢，但能控制关键格并升变。',
    title: '兵怎么走',
    why: '兵不能后退，所以每次兵步都会长期改变局面。',
  },
  {
    category: 'basics',
    fen: '4k3/n7/8/8/8/8/8/R3K3 w Q - 0 1',
    id: 'capturing',
    level: '入门',
    points: ['走到敌方棋子所在格就完成吃子。', '不能吃自己的棋子。', '吃子前要检查会不会立刻被吃回。'],
    recommended: { explanation: 'Rxa7 表示白车吃掉 a7 的黑马。', from: 'a1', label: 'Rxa7', to: 'a7' },
    summary: '吃子是交换棋子的基本方式。',
    title: '怎样吃子',
    why: '多吃一个棋子不一定总是赚到，要看交换后的整体结果。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1',
    id: 'check',
    level: '基础',
    points: ['将军表示王正在被攻击。', '被将军必须立即回应。', '可以移王、挡住攻击或吃掉进攻棋子。'],
    recommended: { explanation: 'Ra8+ 让白车沿第 8 横线攻击黑王。', from: 'a1', label: 'Ra8+', to: 'a8' },
    summary: '将军是一种必须马上回应的威胁。',
    title: '什么是将军',
    why: '让王留在被攻击状态是不合法的。',
  },
  {
    category: 'basics',
    fen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1',
    id: 'checkmate',
    level: '基础',
    points: ['黑王正在被攻击。', '黑王没有安全格，也不能挡住或吃掉进攻棋子。', '将死后对局立即结束。'],
    summary: '王被将军且没有合法应对，就是将死。',
    title: '什么是将死',
    why: '目标是将死，而不是把王或所有棋子吃掉。',
  },
  {
    category: 'basics',
    fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
    id: 'draw',
    level: '基础',
    points: ['黑王没有合法走法，但没有被将军。', '这种情况叫逼和。', '重复局面、五十回合和子力不足也会和棋。'],
    summary: '并非所有不能继续的对局都是输棋。',
    title: '常见和棋',
    why: '优势方如果只顾追王，可能把必胜局面走成逼和。',
  },
  {
    category: 'basics',
    fen: 'r3k2r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R3K2R w KQkq - 4 4',
    id: 'castling',
    level: '基础',
    points: ['易位一次同时移动王和车。', '王、车未移动且中间无子。', '王不能在被将军时或经过受攻击格易位。'],
    recommended: { explanation: 'O-O：王到 g1，h1 车到 f1。', from: 'e1', label: 'O-O', to: 'g1' },
    summary: '王车易位通常能同时保护王并激活车。',
    title: '王车易位',
    why: '王离开中央后，更不容易被打开的中心线路攻击。',
  },
  {
    category: 'basics',
    fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2',
    id: 'en-passant',
    level: '基础',
    points: ['黑兵刚从 d7 一次走到 d5。', '白兵可在 d6 吃掉它。', '只能在对方刚走完两格后立即使用。'],
    recommended: { explanation: 'exd6：白兵到 d6，并移除 d5 黑兵。', from: 'e5', label: 'exd6 e.p.', to: 'd6' },
    summary: '吃过路兵是针对兵首次走两格的特殊吃法。',
    title: '吃过路兵',
    why: '它防止兵一次走两格逃过相邻敌兵的控制。',
  },
  {
    category: 'basics',
    fen: '4k3/P7/8/8/8/8/8/4K3 w - - 0 1',
    id: 'promotion',
    level: '基础',
    points: ['兵到达底线必须升变。', '可选后、车、象或马。', '多数时候升后最强，但不是唯一选择。'],
    recommended: { explanation: 'a8=Q 把白兵升变为后。', from: 'a7', label: 'a8=Q', promotion: 'q', to: 'a8' },
    summary: '兵走到底线后会变成更强的棋子。',
    title: '兵升变',
    why: '残局中的通路兵可能因为升变而决定胜负。',
  },
  {
    category: 'basics',
    fen: START_FEN,
    id: 'clock-basics',
    level: '基础',
    points: ['走完一步后按钟。', '加秒会在每步后补回固定时间。', '要保留完成操作的时间。'],
    summary: '棋钟限制双方整盘棋可用的思考时间。',
    title: '棋钟基础',
    why: '时间也是资源；时间用完，即使局面更好也会判负。',
  },
  {
    category: 'basics',
    fen: START_FEN,
    id: 'pgn-basics',
    level: '基础',
    points: ['PGN 是保存棋局的文本格式。', 'N/B/R/Q/K 分别表示马、象、车、后、王。', 'x、+、# 分别表示吃子、将军、将死。'],
    summary: 'PGN 用简短文字记录双方每一步棋。',
    title: 'PGN 基础',
    why: '会读 PGN 后，就能保存、导入和回放自己的对局。',
  },
  {
    category: 'openings',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    id: 'opening-italian',
    interactive: ITALIAN_INTERACTIVE,
    level: '进阶',
    mistake: { explanation: '3.d3 可以下，但暂时没有让象主动瞄准 f7，发展较慢。', label: '3.d3?!' },
    points: ['白象到 c4，关注 f7。', '继续易位并发展其他棋子。', '不要只盯着一次早期攻击。'],
    recommended: { explanation: '3.Bc4 同时发展象、控制中心并瞄准 f7。', from: 'f1', label: '3.Bc4', to: 'c4' },
    summary: '用快速出子和王翼压力学习开局发展。',
    title: '意大利开局',
    why: '一步同时完成多个目标，通常比只做一件事更有效。',
  },
  {
    category: 'openings',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    id: 'opening-ruy-lopez',
    level: '进阶',
    mistake: { explanation: '3.Bc4 不是坏棋，但会进入意大利开局，不再牵制 c6 马。', label: '3.Bc4' },
    points: ['白象给 c6 马施压。', '目标是增加黑方守住 e5 的难度。', '通常先易位，再决定象的退路。'],
    recommended: { explanation: '3.Bb5 形成西班牙开局的核心结构。', from: 'f1', label: '3.Bb5', to: 'b5' },
    summary: '通过间接攻击 e5 兵争夺中心。',
    title: '西班牙开局',
    why: '攻击一个防守者，有时比直接攻击目标更有力。',
  },
  {
    category: 'openings',
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2',
    id: 'opening-queens-gambit',
    level: '进阶',
    mistake: { explanation: '2.Nc3 会挡住 c 兵，暂时失去用 c4 直接挑战 d5 的机会。', label: '2.Nc3?!' },
    points: ['c4 挑战 d5 中心兵。', '重点是中心空间，不是盲目送兵。', '被吃后常可用 e3 和象取回。'],
    recommended: { explanation: '2.c4 立即向黑方中心施压。', from: 'c2', label: '2.c4', to: 'c4' },
    summary: '用侧翼兵挑战对方中心兵。',
    title: '后翼弃兵',
    why: '侧翼兵交换中心兵，常能换来更好的中心控制。',
  },
  {
    category: 'openings',
    fen: 'rnbqkb1r/ppp1pppp/5n2/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 2 3',
    id: 'opening-london',
    level: '进阶',
    mistake: { explanation: '3.c4 会转入后翼弃兵式结构；不是坏棋，但不再是伦敦布局。', label: '3.c4' },
    points: ['象到 f4，再用 e3、c3 稳固中心。', '固定布局也要观察对方威胁。', '不要机械照搬顺序。'],
    recommended: { explanation: '3.Bf4 是伦敦体系最有代表性的出子。', from: 'c1', label: '3.Bf4', to: 'f4' },
    summary: '提供清晰、稳固的白方发展计划。',
    title: '伦敦体系',
    why: '理解每个棋子的作用，比死记顺序更重要。',
  },
  {
    category: 'openings',
    fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
    id: 'opening-sicilian',
    level: '进阶',
    mistake: { explanation: '2.Qh5 过早出后，黑方可用 ...Nf6 发展棋子并追后。', label: '2.Qh5?!' },
    points: ['黑方用 c5 侧面挑战 d4。', '白方常先 Nf3，再走 d4。', '不对称结构让双方计划不同。'],
    recommended: { explanation: '2.Nf3 发展马，并为 d4 做准备。', from: 'g1', label: '2.Nf3', to: 'f3' },
    summary: '黑方对 1.e4 的积极反击。',
    title: '西西里防御',
    why: '黑方不照搬白方中心，而是争取不对称的主动机会。',
  },
  {
    category: 'openings',
    fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    id: 'opening-french',
    level: '进阶',
    mistake: { explanation: '2.e5 可以下，但立刻关闭中心会减少初学者的选择。', label: '2.e5?!' },
    points: ['黑方用 e6 支持 ...d5。', '白方用 d4 建立双兵中心。', '黑方要设法激活 c8 象。'],
    recommended: { explanation: '2.d4 占据中心，并准备应对 ...d5。', from: 'd2', label: '2.d4', to: 'd4' },
    summary: '用稳固兵链挑战白方中心。',
    title: '法兰西防御',
    why: '兵链会长期决定双方棋子的活动空间。',
  },
  {
    category: 'openings',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    id: 'opening-scotch',
    level: '进阶',
    mistake: { explanation: '3.Bb5 会进入西班牙开局，没有立即用 d4 打开中心。', label: '3.Bb5' },
    points: ['先用 e4 和 Nf3 建立中心压力。', 'd4 立即挑战 e5。', '中心打开后要优先完成出子。'],
    recommended: { explanation: '3.d4 直接攻击 e5，让局面较早开放。', from: 'd2', label: '3.d4', to: 'd4' },
    summary: '用快速打开中心学习苏格兰开局。',
    title: '苏格兰开局挑战',
    training: {
      format: 'challenge',
      objectives: ['从初始局面走出苏格兰开局', '理解 d4 的中心突破'],
      tags: ['开放中心', '快速发展'],
    },
    why: '当自己的棋子发展顺畅时，打开中心能更快形成主动。',
  },
  {
    category: 'openings',
    fen: 'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3',
    id: 'opening-caro-kann',
    level: '进阶',
    mistake: { explanation: '3.e5 可以进入推进变化，但会立刻固定中心，需要理解后续兵链。', label: '3.e5?!' },
    points: ['黑方用 c6 支持 ...d5。', '白方先建立 e4、d4 双兵中心。', 'Nc3 自然发展并保护 e4。'],
    recommended: { explanation: '3.Nc3 发展后翼马，同时加强 e4 中心兵。', from: 'b1', label: '3.Nc3', to: 'c3' },
    summary: '学习应对卡罗-康防御的基础中心布局。',
    title: '卡罗-康防御挑战',
    training: {
      format: 'challenge',
      objectives: ['识别 ...c6 和 ...d5 的计划', '自然发展后翼马'],
      tags: ['双兵中心', '稳固防御'],
    },
    why: '先建立和保护中心，比过早寻找战术更适合初学者。',
  },
  {
    category: 'openings',
    fen: 'rnbqk2r/ppppppbp/5np1/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4',
    id: 'opening-kings-indian',
    level: '进阶',
    mistake: { explanation: '4.h3?! 没有利用黑方暂不占中心的机会，发展速度也较慢。', label: '4.h3?!' },
    points: ['黑方先用马和象远程控制中心。', '白方可以建立 d4、c4、e4 的宽阔中心。', '大中心也需要棋子保护。'],
    recommended: { explanation: '4.e4 建立古典兵中心，争取更多空间。', from: 'e2', label: '4.e4', to: 'e4' },
    summary: '认识王翼印度防御中的中心与远程控制。',
    title: '王翼印度防御挑战',
    training: {
      format: 'challenge',
      objectives: ['建立白方古典中心', '识别黑方王翼象布局'],
      tags: ['封闭中心', '远程控制'],
    },
    why: '对手暂时不放兵进中心时，可以先占空间，但必须准备应对反击。',
  },
  {
    category: 'classics',
    fen: 'rn1qkbnr/ppp2ppp/8/4p3/4P3/5Q2/PPP2PPP/RNB1KB1R w KQkq - 0 6',
    historical: {
      event: '巴黎歌剧院对局',
      players: '保罗·莫菲 - 布伦瑞克公爵与伊苏阿尔伯爵',
      year: 1858,
    },
    id: 'classic-opera-game',
    level: '进阶',
    mistake: { explanation: '6.Qxb7?! 继续用后吃兵会拖慢出子，并让黑方获得追后的时间。', label: '6.Qxb7?!' },
    points: ['莫菲先打开中心。', '每一步尽量发展新棋子。', '领先发展时应尽快让线路参与进攻。'],
    recommended: { explanation: '6.Bc4 发展王翼象，并立即对 f7 施压。', from: 'f1', label: '6.Bc4', to: 'c4' },
    summary: '从歌剧院名局学习快速出子和开放线路。',
    title: '歌剧院名局：快速发展',
    training: {
      format: 'classic-game',
      objectives: ['复现公开棋谱前六回合', '理解发展速度'],
      tags: ['莫菲', '发展', '开放中心'],
    },
    why: '领先发展只有在及时打开线路、让棋子参加战斗时才有价值。',
  },
  {
    category: 'classics',
    fen: 'r1bqk1nr/pppp1ppp/2n5/b3p3/2B1P3/2P2N2/P2P1PPP/RNBQK2R w KQkq - 1 6',
    historical: {
      event: '常青树对局',
      players: '阿道夫·安德森 - 让·迪弗雷纳',
      year: 1852,
    },
    id: 'classic-evergreen',
    level: '进阶',
    mistake: { explanation: '6.d3?! 虽然稳固，却没有利用弃兵换来的时间立即占领中心。', label: '6.d3?!' },
    points: ['伊文斯弃兵用一个兵换取时间。', 'c3 追象并准备 d4。', '弃兵后必须快速发展，不能慢走。'],
    recommended: { explanation: '6.d4 建立中心并打开更多线路。', from: 'd2', label: '6.d4', to: 'd4' },
    summary: '从常青树名局认识弃兵、时间和中心。',
    title: '常青树名局：弃兵争先',
    training: {
      format: 'classic-game',
      objectives: ['复现公开棋谱开局片段', '理解弃兵换时间'],
      tags: ['安德森', '伊文斯弃兵', '主动'],
    },
    why: '主动弃兵不是无偿丢兵，而是必须用更快的出子和中心控制获得补偿。',
  },
  {
    category: 'classics',
    fen: 'rnb1kbnr/p1pp1ppp/8/1p6/2B1Pp1q/8/PPPP2PP/RNBQ1KNR w kq - 0 5',
    historical: {
      event: '不朽对局',
      players: '阿道夫·安德森 - 莱昂内尔·基泽里茨基',
      year: 1851,
    },
    id: 'classic-immortal',
    level: '进阶',
    mistake: { explanation: '5.Be2?! 保住象但放弃吃兵机会，也让黑方免费获得后翼空间。', label: '5.Be2?!' },
    points: ['王翼弃兵属于冒险的开放型开局。', '被将军时必须先解除威胁。', '历史名局可学习思想，不应机械模仿牺牲。'],
    recommended: { explanation: '5.Bxb5 接受黑方反弃兵，并保留象的活跃位置。', from: 'c4', label: '5.Bxb5', to: 'b5' },
    summary: '复现不朽对局开局，认识浪漫主义进攻。',
    title: '不朽对局：主动与风险',
    training: {
      format: 'classic-game',
      objectives: ['复现公开棋谱前五回合', '区分主动进攻与无根据冒险'],
      tags: ['安德森', '王翼弃兵', '王安全'],
    },
    why: '经典棋局的价值在于理解选择背后的代价，而不是把每一步当成固定答案。',
  },
  {
    category: 'strategy',
    fen: '4k3/8/8/8/3q4/2N5/8/4K3 w - - 0 1',
    id: 'strategy-piece-safety',
    level: '进阶',
    mistake: { explanation: '1.Kf1? 没处理 c3 马被攻击的问题，下一步可能白白丢马。', label: '1.Kf1?' },
    points: ['对手走完先检查自己的棋子。', '没有保护的棋子很容易丢失。', '可撤退、保护、交换或制造更强威胁。'],
    recommended: { explanation: '1.Nb5 把被攻击的马移到安全格。', from: 'c3', label: '1.Nb5', to: 'b5' },
    summary: '先避免无偿丢子，再考虑进攻。',
    title: '子力安全',
    why: '初学者多数失误来自漏看某个棋子正在被攻击。',
  },
  {
    category: 'strategy',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 6 4',
    id: 'strategy-king-safety',
    level: '进阶',
    mistake: { explanation: '4.Qe2?! 继续把王留在中央，中心打开后更容易遭到将军。', label: '4.Qe2?!' },
    points: ['中央线路可能很快打开。', '易位同时改善王和车的位置。', '易位后也不要随便推动王前兵。'],
    recommended: { explanation: '4.O-O 让王离开中央并激活 h1 车。', from: 'e1', label: '4.O-O', to: 'g1' },
    summary: '发展完成后，通常应尽快让王离开中央。',
    title: '王的安全',
    why: '中央打开后，未易位的王会让每次将军都很危险。',
  },
  {
    category: 'strategy',
    fen: START_FEN,
    id: 'strategy-center',
    interactive: CENTER_INTERACTIVE,
    level: '进阶',
    mistake: { explanation: '1.a3?! 没争夺中心，也没有发展棋子。', label: '1.a3?!' },
    points: ['e4、d4、e5、d5 是中心四格。', '控制中心后棋子更容易转向两翼。', '可以占据中心，也可以远程控制。'],
    recommended: { explanation: '1.e4 占据中心，并打开后与 f1 象的线路。', from: 'e2', label: '1.e4', to: 'e4' },
    summary: '中心控制决定棋子能否快速进入战场。',
    title: '中心控制',
    why: '中心棋子通常有更多选择，更容易支援不同方向。',
  },
  {
    category: 'strategy',
    fen: '4k3/8/8/8/8/8/8/R3K3 w Q - 0 1',
    id: 'strategy-open-file',
    level: '进阶',
    mistake: { explanation: '1.Rb1?! 没利用完全开放的 a 线制造压力。', label: '1.Rb1?!' },
    points: ['没有兵占据的竖线叫开放线。', '车可沿开放线深入对方阵地。', '两车叠在同一线会增加压力。'],
    recommended: { explanation: '1.Ra8+ 沿开放 a 线进入第 8 横线将军。', from: 'a1', label: '1.Ra8+', to: 'a8' },
    summary: '开放线是车最自然的活动道路。',
    title: '开放线',
    why: '车放在被兵堵住的线路后面，很难发挥远距离能力。',
  },
  {
    category: 'strategy',
    fen: '2r3k1/8/8/5N2/8/8/8/4K3 w - - 0 1',
    id: 'strategy-tactics',
    level: '进阶',
    mistake: { explanation: '1.Nh6+? 虽然将军，却没有同时攻击 c8 的车。', label: '1.Nh6+?' },
    points: ['双重攻击是一步威胁两个目标。', '将军必须回应，所以带将军的双攻很强。', '马很适合制造双攻。'],
    recommended: { explanation: '1.Ne7+ 将军，同时攻击 c8 黑车。', from: 'f5', label: '1.Ne7+', to: 'e7' },
    summary: '基础战术的核心是让一步棋产生两个威胁。',
    title: '双重攻击',
    why: '对手通常一次只能处理一个问题。',
  },
  {
    category: 'strategy',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    id: 'challenge-development',
    level: '基础',
    mistake: { explanation: '4.d3?! 可以下，但此时继续把王留在中央，没有完成本挑战的安全目标。', label: '4.d3?!' },
    points: ['先用中心兵打开线路。', '尽早发展马和象。', '王翼易位同时保护王并激活车。'],
    recommended: { explanation: '4.O-O 完成基础开局的最后一项：保护王。', from: 'e1', label: '4.O-O', to: 'g1' },
    summary: '连续完成占中心、出子和易位。',
    title: '挑战：完成基础开局',
    training: {
      format: 'challenge',
      objectives: ['连续完成四个基础开局目标', '在实战流程中完成易位'],
      tags: ['中心', '发展', '王安全'],
    },
    why: '初学阶段先完成稳定的开局清单，能减少过早进攻造成的失误。',
  },
  {
    category: 'strategy',
    fen: '2r3k1/8/8/5N2/8/8/8/4K3 w - - 0 1',
    id: 'challenge-knight-fork',
    level: '进阶',
    mistake: { explanation: '1.Nh6+? 只有将军，没有同时攻击 c8 的车。', label: '1.Nh6+?' },
    points: ['先找必须回应的将军。', '再检查同一步是否攻击第二个目标。', '马的跳跃能力适合制造双攻。'],
    recommended: { explanation: '1.Ne7+ 同时将军并攻击 c8 黑车。', from: 'f5', label: '1.Ne7+', to: 'e7' },
    summary: '从基础开局进入专题局面，完成一次马的双重攻击。',
    title: '挑战：找到带将军的双攻',
    training: {
      format: 'challenge',
      objectives: ['识别强制着法', '完成马的双重攻击'],
      tags: ['战术', '双攻', '将军'],
    },
    why: '带将军的双攻迫使对手先救王，通常能赢得另一个目标。',
  },
  {
    category: 'endgames',
    fen: '8/4k3/8/4K3/4P3/8/8/8 w - - 0 1',
    id: 'endgame-king-pawn',
    interactive: KING_PAWN_INTERACTIVE,
    level: '进阶',
    mistake: { explanation: '1.e5? 过早推兵会减少调整空间，兵更容易被挡住。', label: '1.e5?' },
    points: ['残局中王要主动。', '用对王争夺关键格。', '先改善王，再决定何时推兵。'],
    recommended: { explanation: '1.Kd5 让白王占据前方关键格。', from: 'e5', label: '1.Kd5', to: 'd5' },
    summary: '胜负常取决于王能否走到兵前面。',
    title: '王兵残局与对王',
    why: '残局中王从需要保护的目标变成重要进攻棋子。',
  },
  {
    category: 'endgames',
    fen: '8/8/4k3/4P3/4K3/8/8/R7 w - - 0 1',
    id: 'endgame-rook-pawn',
    level: '进阶',
    mistake: { explanation: '1.Kd4? 让王离开兵，也没有限制黑王。', label: '1.Kd4?' },
    points: ['车可以从远处把对方王切开。', '自己的王和兵要配合。', '先限制王，再逐步推兵。'],
    recommended: { explanation: '1.Ra6+ 用横向将军迫使黑王离开第 6 横线。', from: 'a1', label: '1.Ra6+', to: 'a6' },
    summary: '先用车限制王，再护送兵前进。',
    title: '基础车兵残局',
    why: '车的远距离能力能为自己的王兵争取时间。',
  },
  {
    category: 'endgames',
    fen: '7k/8/5K2/6Q1/8/8/8/8 w - - 0 1',
    id: 'endgame-queen-mate',
    level: '进阶',
    mistake: { explanation: '1.Qg6? 会逼和：黑王无路可走，但没有被将军。', label: '1.Qg6?' },
    points: ['后先限制敌王。', '自己的王负责保护后。', '最后确认敌王确实被将军。'],
    recommended: { explanation: '1.Qg7# 由白王保护白后，完成将死。', from: 'g5', label: '1.Qg7#', to: 'g7' },
    summary: '后王配合可以把单王压到边线。',
    title: '后王杀单王',
    why: '后不能安全地单独贴近敌王，需要自己的王保护。',
  },
  {
    category: 'endgames',
    fen: '7k/5K2/8/8/8/8/8/R7 w - - 0 1',
    id: 'endgame-rook-mate',
    level: '进阶',
    mistake: { explanation: '1.Ra8+? 只是将军，没有利用白王控制的逃跑格结束对局。', label: '1.Ra8+?' },
    points: ['车负责切断一排或一线。', '自己的王控制相邻逃跑格。', '把敌王赶到边线再将死。'],
    recommended: { explanation: '1.Rh1#：车控制 h 线，白王控制 g8 与 g7。', from: 'a1', label: '1.Rh1#', to: 'h1' },
    summary: '车王配合是最基本的杀王方法之一。',
    title: '车王杀单王',
    why: '车不能控制斜线，所以必须依靠王封住逃跑格。',
  },
  {
    category: 'endgames',
    fen: '7k/8/8/2P5/8/8/8/K7 w - - 0 1',
    id: 'challenge-pawn-square',
    level: '基础',
    mistake: { explanation: '1.Kb2? 浪费一步后，黑王会更接近通路兵的方格。', label: '1.Kb2?' },
    points: ['计算兵到升变还需要几步。', '用同样边长画出“兵的方格”。', '敌王在方格外且轮到兵走时，通常追不上。'],
    recommended: { explanation: '1.c6 立即推进，黑王位于兵的方格之外。', from: 'c5', label: '1.c6', to: 'c6' },
    summary: '从基础开局进入残局，使用方格法判断通路兵。',
    title: '挑战：兵的方格法',
    training: {
      format: 'challenge',
      objectives: ['判断黑王能否追上通路兵', '及时推进远方通路兵'],
      tags: ['残局', '通路兵', '方格法'],
    },
    why: '方格法能在不逐步计算每个王步时，快速判断兵能否独自升变。',
  },
  {
    category: 'endgames',
    fen: '8/4k3/8/3PK3/8/8/8/8 w - - 0 1',
    id: 'challenge-protected-passer',
    level: '进阶',
    mistake: { explanation: '1.Kf5?! 没有利用当前机会推进兵，反而给黑王调整位置。', label: '1.Kf5?!' },
    points: ['自己的王要保护通路兵前进。', '推进带将军能迫使对方先回应。', '王不能吃被敌王保护的兵。'],
    recommended: { explanation: '1.d6+ 推兵将军；黑王不能吃 d6，因为白王保护该格。', from: 'd5', label: '1.d6+', to: 'd6' },
    summary: '让王保护通路兵，并用带将军的推进争取时间。',
    title: '挑战：受保护的通路兵',
    training: {
      format: 'challenge',
      objectives: ['识别受王保护的推进格', '利用带将军的兵步'],
      tags: ['残局', '通路兵', '王的配合'],
    },
    why: '残局中，王和兵互相保护时能形成对方王无法直接阻挡的推进。',
  },
];

function createRecommendedMoveInteractive(
  lesson: LessonDefinition,
): InteractiveLesson | undefined {
  const recommended = lesson.recommended;

  if (!recommended) {
    return undefined;
  }

  const game = new Chess(lesson.fen);
  game.move({
    from: recommended.from,
    promotion: recommended.promotion,
    to: recommended.to,
  });
  const opponent = game.isGameOver()
    ? undefined
    : {
        difficulty: 'intermediate' as const,
        mode: 'local-ai' as const,
      };

  return {
    completion: `你已经亲手走出 ${recommended.label}。可以重来，比较提示与常见错误说明。`,
    goal: `在棋盘上走出推荐着法 ${recommended.label}。`,
    intro:
      '先根据课程目标自己判断。走对后，本地 AI 会给出一个合法回应；以后可替换为 Stockfish。',
    startFen: lesson.fen,
    steps: [
      {
        acceptedMoves: [
          {
            from: recommended.from,
            promotion: recommended.promotion,
            to: recommended.to,
          },
        ],
        explanation: recommended.explanation,
        hint: `从 ${recommended.from} 出发，尝试走到 ${recommended.to}。`,
        id: 'recommended-move',
        incorrectFeedback:
          lesson.mistake?.explanation ??
          `这一步还没有完成本课目标，请寻找 ${recommended.label}。`,
        instruction: `请走出 ${recommended.label}，并观察它如何完成本课目标。`,
        opponent,
      },
    ],
  };
}

function prependFoundation(
  lesson: LessonDefinition,
  focus: InteractiveLesson,
): InteractiveLesson {
  if (focus.startFen === START_FEN) {
    return focus;
  }

  const foundation = createFoundationSteps();
  const transitionStep = foundation[foundation.length - 1];

  transitionStep.transition = {
    fen: focus.startFen,
    message: `基础开局完成。现在进入“${lesson.title}”的专题局面。`,
  };

  return {
    ...focus,
    intro: `先与离线 AI 从标准初始局面完成基础开局，再进入专题练习。${focus.intro}`,
    startFen: START_FEN,
    steps: [...foundation, ...focus.steps],
  };
}

function createKnowledgeInteractive(
  lesson: LessonDefinition,
): InteractiveLesson {
  const steps = createFoundationSteps();
  const lastStep = steps[steps.length - 1];

  if (lesson.fen !== START_FEN) {
    lastStep.transition = {
      fen: lesson.fen,
      message: `基础开局完成。棋盘已切换到“${lesson.title}”的说明局面。`,
    };
  }

  return {
    completion: `你完成了从标准初始局面开始的对弈，并进入“${lesson.title}”的说明。${lesson.summary}`,
    goal: `先完成基础开局，再结合棋盘理解“${lesson.title}”。`,
    intro: '由你执白，离线 AI 负责黑方回应。',
    startFen: START_FEN,
    steps,
  };
}

function createBuiltInLesson(lesson: LessonDefinition): ChessLesson {
  const explicit =
    STANDARD_START_INTERACTIONS[lesson.id] ?? lesson.interactive;
  const focus =
    explicit ?? createRecommendedMoveInteractive(lesson);
  const interactive = focus
    ? prependFoundation(lesson, focus)
    : createKnowledgeInteractive(lesson);
  const defaultFormat =
    lesson.category === 'classics'
      ? 'classic-game'
      : lesson.id.startsWith('challenge-')
        ? 'challenge'
        : 'guided';

  return {
    ...lesson,
    interactive,
    training: {
      format: lesson.training?.format ?? defaultFormat,
      objectives: lesson.training?.objectives ?? [lesson.summary],
      source: 'built-in',
      standardStart: interactive.startFen === START_FEN,
      tags: lesson.training?.tags ?? [
        LESSON_CATEGORY_LABELS[lesson.category],
        lesson.level,
      ],
    },
  };
}

export const LESSONS: ChessLesson[] =
  LESSON_CATALOG.map(createBuiltInLesson);

const ADVANCED_CATEGORIES = new Set<LessonCategory>([
  'openings',
  'classics',
  'strategy',
  'endgames',
]);

export function getLessonsByCategory(
  category: LessonCategory,
): ChessLesson[] {
  return LESSONS.filter((lesson) => lesson.category === category);
}

export function validateLessonCatalog(
  lessons: ChessLesson[] = LESSONS,
): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();

  lessons.forEach((lesson) => {
    if (ids.has(lesson.id)) {
      issues.push(`${lesson.id}: 课程 ID 重复`);
    }
    ids.add(lesson.id);

    let chess: Chess;
    try {
      chess = new Chess(lesson.fen);
    } catch {
      issues.push(`${lesson.id}: FEN 无法读取`);
      return;
    }

    if (lesson.points.length === 0 || !lesson.why.trim()) {
      issues.push(`${lesson.id}: 缺少教学解释`);
    }
    if (!lesson.interactive) {
      issues.push(`${lesson.id}: 缺少互动对弈`);
    } else if (
      lesson.training.source === 'built-in' &&
      lesson.interactive.startFen !== START_FEN
    ) {
      issues.push(`${lesson.id}: 内置课程没有从标准初始局面开始`);
    }
    if (
      lesson.training.objectives.length === 0 ||
      lesson.training.tags.length === 0
    ) {
      issues.push(`${lesson.id}: 缺少训练数据`);
    }
    if (
      ADVANCED_CATEGORIES.has(lesson.category) &&
      (!lesson.recommended || !lesson.mistake)
    ) {
      issues.push(`${lesson.id}: 进阶课程缺少推荐走法或错误说明`);
    }

    if (lesson.recommended) {
      const tip = lesson.recommended;
      const legal = chess.moves({ verbose: true }).some(
        (move) =>
          move.from === tip.from &&
          move.to === tip.to &&
          (tip.promotion === undefined ||
            move.promotion === tip.promotion),
      );
      if (!legal) {
        issues.push(`${lesson.id}: 推荐走法不合法`);
      }
    }
  });

  return issues;
}
