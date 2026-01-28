
export interface Task {
  id: string;
  title: string;
  assignee: string;
  isCompleted: boolean;
  deadline?: string;
}

export interface Step {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  goal: string;
  deadline: string;
  steps: Step[];
  memberNames: string[]; // プロジェクト固有のメンバー
  currentStepId: string;
  nextAction: string;
  issues: string;
  isArchived: boolean;
}

export interface UpdateLog {
  id: string;
  projectId: string;
  projectName: string;
  memberName: string;
  action: string;
  timestamp: number;
}

export enum ViewMode {
  LIST = 'LIST',
  DETAIL = 'DETAIL',
  ADMIN = 'ADMIN'
}
