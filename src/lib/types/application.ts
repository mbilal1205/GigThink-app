export type ApplicationStatus = 
  | 'preparing'
  | 'ready'
  | 'applying'
  | 'submitted'
  | 'viewed'
  | 'interview'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  current_step?: string;
  resume_id?: string;
  cover_letter_id?: string;
  answers: Record<string, any>;
  extra_data: Record<string, any>;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  job_id?: string;
  title: string;
  content: string;
  version: number;
  is_master: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoverLetter {
  id: string;
  user_id: string;
  job_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}