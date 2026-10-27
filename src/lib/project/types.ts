export type ProjectStatus = "ACTIVE" | "CLOSED";

export interface ProjectMember {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Project {
  id: number;
  project_code: string;
  name: string;
  description: string;
  budget: string;
  pm: ProjectMember;
  pc: ProjectMember | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
}

export interface ProjectListParams {
  status?: ProjectStatus;
  pm_user_id?: number;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface ProjectMeta {
  page: number;
  per_page: number;
  total: number;
}
