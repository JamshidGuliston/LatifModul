export interface Student {
  id: string;
  teacher: string;
  teacher_name?: string;
  email: string;
  full_name: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentCreate {
  teacher: string;
  email: string;
  password: string;
  full_name: string;
  avatar?: string;
}
