export interface Module {
  id: string;
  teacher: string;
  title: string;
  description?: string;
  thumbnail?: string;
  order_index: number;
  is_sequential: boolean;
  is_published: boolean;
  lessons_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleDetail extends Module {
  lessons: any[];
  contents: any[];
}
