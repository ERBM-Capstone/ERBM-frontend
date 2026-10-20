export interface User {
  user_id: number;
  employee_id: number;
  email: string;
  status: "INVITED" | "ACTIVE" | "DEACTIVATED";
  first_login: boolean;
  role_code: "EMPLOYEE" | "ADMIN" | "PC" | "PM" | "ACCOUNTING";
  first_name: string;
  last_name: string;
  position: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  expiresAt: number | null; // unix ms
}
