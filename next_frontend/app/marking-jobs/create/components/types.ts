import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export type JobPriority = "normal" | "urgent";

export interface MarkingJobForm {
  name: string;
  description: string;
  priority: JobPriority;
  template_id: string;
  markingSchemeFile: File | null;
  answerSheetsFile: File | null;
  save_intermediate_results: boolean;
}

export interface MarkingJob {
  id: number | null;
  name: string | null;
  template_id: number | null;
  markingSchemeFileId: number | null;
  markingSchemeFile: File | null;
  answerSheetsFileId: number | null;
  answerSheetsFile: File | null;
  save_intermediate_results: boolean | null;
}

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: IconDefinition;
}
