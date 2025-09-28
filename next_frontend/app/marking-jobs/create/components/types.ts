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

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: IconDefinition;
}
