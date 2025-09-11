// Define template types for MCQ grading system
type TemplateType = "MCQ" | "Quiz" | "Rubric" | "Report" | "Test";

interface Template {
  id: number;
  name: string;
  type: TemplateType;
  created: string;
  lastUsed: string;
  status: "active" | "inactive";
  questionCount?: number;
  description?: string;
}

export type { Template, TemplateType };
