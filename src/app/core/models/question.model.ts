export interface Question {
  id: string;
  assignment: string;
  question_text: string;
  question_data: any;
  correct_answer: any;
  points: number;
  order_index: number;
  explanation?: string;
}
