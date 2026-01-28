
import { Project } from './types';

export const MEMBER_NAMES = [
  "佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
  "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水"
];

const createInitialSteps = (projectId: string): any[] => {
  const steps = [
    "企画・立案",
    "メンバー招集・役割分担",
    "詳細設計・スケジュール作成",
    "実行フェーズ・中間共有",
    "最終調整・リハーサル",
    "本番・イベント実施",
    "振り返り・報告書作成"
  ];
  return steps.map((name, index) => ({
    id: `${projectId}-step-${index}`,
    name,
    order: index,
    tasks: [
      { 
        id: `${projectId}-s${index}-t1`, 
        title: `${name}のタスクA`, 
        assignee: MEMBER_NAMES[index % MEMBER_NAMES.length], 
        isCompleted: false,
        deadline: "2025-04-01"
      }
    ]
  }));
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "卒業式プロジェクト",
    goal: "最高の卒業式を演出する (参加満足度95%以上)",
    deadline: "2025-03-20",
    steps: createInitialSteps("proj-1"),
    memberNames: ["佐藤", "鈴木", "高橋"],
    currentStepId: "proj-1-step-2",
    nextAction: "会場の装飾デザイン案を確定させる",
    issues: "予算の配分が難航している",
    isArchived: false
  },
  {
    id: "proj-2",
    name: "SNS運用強化",
    goal: "フォロワー1万人達成",
    deadline: "2025-06-30",
    steps: createInitialSteps("proj-2"),
    memberNames: ["田中", "伊藤"],
    currentStepId: "proj-2-step-1",
    nextAction: "リール動画の投稿スケジュール作成",
    issues: "編集スキルのあるメンバーが不足している",
    isArchived: false
  },
  {
    id: "proj-3",
    name: "企業査定",
    goal: "提携企業10社開拓",
    deadline: "2025-12-31",
    steps: createInitialSteps("proj-3"),
    memberNames: ["渡辺", "山本"],
    currentStepId: "proj-3-step-0",
    nextAction: "アタックリストの作成",
    issues: "特になし。順調。",
    isArchived: false
  },
  {
    id: "proj-4",
    name: "地域創生プロジェクト",
    goal: "地元商店街とのコラボイベント実施",
    deadline: "2025-08-15",
    steps: createInitialSteps("proj-4"),
    memberNames: ["中村", "小林"],
    currentStepId: "proj-4-step-3",
    nextAction: "商店街組合への最終プレゼン",
    issues: "実施日の調整が難航している",
    isArchived: false
  },
  {
    id: "proj-5",
    name: "社長密着発信",
    goal: "起業家10名へのインタビュー完遂",
    deadline: "2025-05-10",
    steps: createInitialSteps("proj-5"),
    memberNames: ["加藤", "吉田"],
    currentStepId: "proj-5-step-2",
    nextAction: "3人目の社長へのアポ取り",
    issues: "インタビュー日程の確保",
    isArchived: false
  }
];
