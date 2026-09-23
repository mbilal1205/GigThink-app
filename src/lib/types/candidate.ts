export interface WorkExperience {
  company: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  description?: string;
  skills_used?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  start_date?: string;
  end_date?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface CandidateProfile {
  id?: string;
  user_id?: string;
  full_name?: string;
  headline?: string;
  summary?: string;
  skills?: string[];
  additional_skills?: string[];
  experience_level?: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  work_experience?: WorkExperience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];
  preferred_roles?: string[];
  preferred_industries?: string[];
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  currency?: string;
  preferred_locations?: string[];
  remote_preference?: 'remote' | 'hybrid' | 'onsite' | 'any';
  work_authorization?: any;
  visa_sponsorship_required?: boolean;
  company_preferences?: Record<string, any>;
  excluded_companies?: string[];
  career_goals?: string;
  onboarding_completed?: boolean;
}