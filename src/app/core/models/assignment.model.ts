export interface AssignmentType {
  id: string;
  name: string;
  description?: string;
  config_schema?: any;
  is_auto_graded: boolean;
}

export interface Assignment {
  id: string;
  lesson: string;
  assignment_type: string;
  title: string;
  description?: string;
  total_points: number;
  time_limit?: number;
  attempts_allowed: number;
  order_index: number;
  is_published: boolean;
  questions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentDetail extends Assignment {
  questions: any[];
}
