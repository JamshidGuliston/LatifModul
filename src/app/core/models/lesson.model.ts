export interface Lesson {
  id: string;
  module: string;
  title: string;
  description?: string;
  order_index: number;
  is_sequential: boolean;
  required_completion_percent: number;
  is_published: boolean;
  assignments_count?: number;
  created_at: string;
  updated_at: string;
}

export interface LessonDetail extends Lesson {
  contents: any[];
}
