export interface ContentType {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface ModuleContent {
  id: string;
  module: string;
  content_type: string;
  type_name?: string;
  title: string;
  content?: string;
  file_url?: string;
  video_url?: string;
  order_index: number;
  created_at: string;
}

export interface LessonContent {
  id: string;
  lesson: string;
  content_type: string;
  type_name?: string;
  title: string;
  content?: string;
  file_url?: string;
  video_url?: string;
  order_index: number;
  created_at: string;
}
