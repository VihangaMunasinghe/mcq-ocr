// Define template config types
type ConfigType = "grid_based" | "clustering_based";

// Define template status
type TemplateStatus = "queued" | "processing" | "completed" | "failed";

interface Template {
  id: number;
  name: string;
  status: TemplateStatus;
  description: string;
  config_type: ConfigType;
  configuration_path: string;
  template_file_path: string;
  num_questions: number;
  options_per_question: number;
  created_at: string;   // ISO timestamp
  updated_at: string;   // ISO timestamp
  created_by: number;   // user id
}

export type { Template, TemplateStatus, ConfigType };