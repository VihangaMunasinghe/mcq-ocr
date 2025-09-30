export interface StudentResult {
  row_number: number;
  index_number: string;
  correct: number;
  incorrect: number;
  more_than_one_marked: number;
  not_marked: number;
  columnwise_total: number[];
  score: number;
  flag: boolean;
  flag_reason: string;
  answer_sheet_path?: string;
  labeled_points?: Record<string, unknown>;
}

export interface JobInfo {
  id: number;
  name: string;
  template_name: string;
  priority: string;
  status: string;
  marking_config_id: number;
  result_sheet_file_id: number;
  created_at: string;
  updated_at: string;
  processing_started_at?: string;
  processing_completed_at?: string;
}

export interface ResultsData {
  job_info: JobInfo;
  results: StudentResult[];
  total_answer_sheets: number;
  processed_answer_sheets: number;
  failed_answer_sheets: number;
}
