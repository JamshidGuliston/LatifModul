export interface AssignmentType {
  id: string;
  name: string;
  description?: string;
  config_schema?: any;
  grader_type?: string;
  is_auto_graded?: boolean;
}

export interface Assignment {
  id: string;
  lesson: string;
  assignment_type: AssignmentType;
  title: string;
  description?: string;
  total_points: number;
  time_limit?: number;
  attempts_allowed: number;
  order_index: number;
  is_published: boolean;
  questions_count?: number;
  questions_max_score?: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentDetail extends Assignment {
  parts: any[];
  questions: AssignmentQuestion[];
}

export interface AssignmentQuestion {
  id: string;
  assignment: string;
  part?: string | null;
  question_text: string;
  question_data: any;
  correct_answer?: any;
  points: number;
  order_index: number;
  explanation?: string;
}
