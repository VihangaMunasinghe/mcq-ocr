export type JobStatus =
  | "pending"
  | "processing"
  | "in-progress"
  | "review-required"
  | "completed"
  | "cancelled";

export interface MarkingJob {
  id: number;
  name: string;
  template: string;
  templateType: string;
  created: string;
  status: JobStatus;
  submissions: number;
  marked: number;
  flaggedQuestions?: number[];
}

export interface ReviewQuestion {
  id: number;
  question: string;
  options: string[];
  markedAnswer: string;
  suggestedAnswer: string;
  issue: string;
}

export interface StatusFilterOption {
  value: string;
  label: string;
}
