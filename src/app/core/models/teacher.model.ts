export interface Teacher {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  bio?: string;
  settings?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherCreate {
  email: string;
  password: string;
  full_name: string;
  avatar?: string;
  bio?: string;
  settings?: any;
}
