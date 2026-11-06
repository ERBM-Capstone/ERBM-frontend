import type { User } from "./types";

const ROLE_LABELS: Record<User["role_code"], string> = {
  EMPLOYEE: "Employee",
  ADMIN: "Administrator",
  PC: "Project Coordinator",
  PM: "Project Manager",
  ACCOUNTING: "Accounting",
};

export function roleLabel(role: User["role_code"]): string {
  return ROLE_LABELS[role];
}
