export interface StudentModuleEnrollment {
  id: string;
  student: string;
  student_name?: string;
  module: string;
  module_title?: string;
  enrolled_at: string;
  completed_at?: string;
  progress_percent: number;
}

export interface StudentLessonProgress {
  id: string;
  student: string;
  student_name?: string;
  lesson: string;
  lesson_title?: string;
  is_unlocked: boolean;
  started_at?: string;
  completed_at?: string;
  completion_percent: number;
}

export interface AssignmentAttempt {
  id: string;
  student: string;
  student_name?: string;
  assignment: string;
  assignment_title?: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
  score?: number;
  max_score: number;
  percentage?: number;
  is_passed?: boolean;
}

export interface QuestionAnswer {
  id: string;
  attempt: string;
  question: string;
  answer_data: any;
  is_correct?: boolean;
  points_earned: number;
  feedback?: string;
  answered_at: string;
}
