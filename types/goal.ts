export interface GoalData {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
  isActive: boolean;
  color: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  percent: number;
}
