"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LuArrowLeft, LuCheck, LuChevronRight } from "react-icons/lu";
import { useAuth } from "@/lib/auth/context";
import DropdownSelect from "@/components/ui/DropdownSelect";
import { fetchAllPages } from "@/lib/project/fetch-all-pages";
import type { Project, ProjectMember } from "@/lib/project/types";

interface EmployeeSummary {
  email: string;
  is_active: boolean;
}

const MOCK_DEPT = [
  { id: "IT", label: "เทคโนโลยีสารสนเทศ" },
  { id: "FIN", label: "การเงิน" },
  { id: "HR", label: "ทรัพยากรบุคคล" },
  { id: "OPS", label: "ปฏิบัติการ" },
];

/* ─── Field component ─── */
interface FieldProps {
  id: string;
  label: string;
  subLabel: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
function Field({ id, label, subLabel, required, error, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text-primary">{label}</label>
        {required && <span className="text-danger-text text-sm font-medium" aria-hidden>*</span>}
      </div>
      <span id={`${id}-hint`} className="text-xs text-text-secondary -mt-1">{subLabel}</span>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger-text">{error}</p>
      )}
    </div>
  );
}

/* Shared fields follow the Red Broadcast surface and focus treatment. */
const inputCls = (hasError: boolean) =>
  `form-input ${hasError ? "border-danger" : ""}`;

/* ─── Page ─── */
interface FormValues {
  name: string;
  pm_user_id: string;
  pc_user_id: string;
  department: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  name?: string;
  pm_user_id?: string;
  pc_user_id?: string;
}

const FIELD_IDS: Record<keyof FormErrors, string> = {
  name: "project-name",
  pm_user_id: "project-pm",
  pc_user_id: "project-pc",
};

export default function CreateProjectPage() {
  const router = useRouter();
  const { getToken, user, isLoading: isAuthLoading } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [pmOptions, setPmOptions] = useState<ProjectMember[]>([]);
  const [pcOptions, setPcOptions] = useState<ProjectMember[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(true);
  const [assigneeError, setAssigneeError] = useState<string | null>(null);
  const [assigneeReload, setAssigneeReload] = useState(0);

  const [values, setValues] = useState<FormValues>({
    name: "",
    pm_user_id: "",
    pc_user_id: "",
    department: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);

    async function loadAssignees() {
      try {
        if (user?.role_code !== "ADMIN") {
          throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่โหลดรายชื่อผู้รับผิดชอบได้");
        }
        const token = await getToken();
        if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

        const [employees, projects] = await Promise.all([
          fetchAllPages<EmployeeSummary>("/api/employees", new URLSearchParams(), token, controller.signal),
          fetchAllPages<Project>("/api/projects", new URLSearchParams(), token, controller.signal),
        ]);
        const activeEmails = new Set(
          employees.filter((employee) => employee.is_active).map((employee) => employee.email.trim().toLowerCase()),
        );
        const activePMs = new Map<number, ProjectMember>();
        const activePCs = new Map<number, ProjectMember>();

        for (const project of projects) {
          if (activeEmails.has(project.pm.email.trim().toLowerCase())) {
            activePMs.set(project.pm.user_id, project.pm);
          }
          if (project.pc && activeEmails.has(project.pc.email.trim().toLowerCase())) {
            activePCs.set(project.pc.user_id, project.pc);
          }
        }

        const sortByName = (a: ProjectMember, b: ProjectMember) =>
          `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, "th");
        if (active) {
          setPmOptions([...activePMs.values()].sort(sortByName));
          setPcOptions([...activePCs.values()].sort(sortByName));
          setAssigneeError(null);
        }
      } catch (error) {
        if (active) {
          setAssigneeError(
            controller.signal.aborted
              ? "โหลดรายชื่อใช้เวลานานเกินไป กรุณาลองอีกครั้ง"
              : error instanceof Error
                ? error.message
                : "โหลดรายชื่อผู้รับผิดชอบไม่สำเร็จ",
          );
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setIsLoadingAssignees(false);
      }
    }

    loadAssignees();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [assigneeReload, getToken, isAuthLoading, user?.role_code]);

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!values.name.trim()) e.name = "กรุณาระบุชื่อโปรเจค";
    if (!values.pm_user_id) e.pm_user_id = "กรุณาเลือกผู้จัดการโปรเจค";
    if (!values.pc_user_id) e.pc_user_id = "กรุณาเลือกผู้ประสานงานโปรเจค";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstError = Object.keys(errs)[0] as keyof FormErrors;
      formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(`#${FIELD_IDS[firstError]}`)?.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getToken();

      const body: Record<string, unknown> = {
        name: values.name.trim(),
        pm_user_id: Number(values.pm_user_id),
        pc_user_id: Number(values.pc_user_id),
      };
      if (values.description.trim()) body.description = values.description.trim();
      if (values.start_date) body.start_date = values.start_date;
      if (values.end_date) body.end_date = values.end_date;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message ?? "บันทึกไม่สำเร็จ");
      }

      router.push("/project?success=created");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <nav aria-label="เส้นทางหน้า" className="mb-6 flex items-center gap-2 text-xs text-text-secondary">
        <Link href="/project" className="inline-flex min-h-8 items-center hover:text-secondary">Project</Link>
        <LuChevronRight size={14} aria-hidden />
        <span aria-current="page">สร้างโปรเจค</span>
      </nav>
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl font-bold leading-8 text-text-primary">สร้างโปรเจค</h1>
        <p className="mt-1 text-sm text-text-secondary">กรอกข้อมูลเพื่อสร้างโปรเจคใหม่ในระบบ</p>
        <p className="mt-3 text-xs text-text-secondary">
          <span className="text-danger-text font-medium">*</span> จำเป็นต้องกรอกข้อมูล
        </p>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="py-8 space-y-8">
          <h2 className="text-xl font-medium leading-7">ข้อมูลโครงการ</h2>

          {/* Row 1: Project Name */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              id="project-name"
              label="ชื่อโปรเจค"
              subLabel="Project Name"
              required
              error={errors.name}
            >
              <input
                type="text"
                id="project-name"
                required
                aria-invalid={!!errors.name}
                aria-describedby={`project-name-hint${errors.name ? " project-name-error" : ""}`}
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ระบุ ชื่อโปรเจค"
                maxLength={255}
                className={inputCls(!!errors.name)}
                disabled={isSubmitting}
              />
            </Field>

          </div>

          <h2 className="border-t border-border pt-8 text-xl font-medium leading-7">ผู้รับผิดชอบ</h2>
          {/* Row 2: PM + PC */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              id="project-pm"
              label="ผู้จัดการโปรเจค (PM)"
              subLabel="Responsible PM"
              required
              error={errors.pm_user_id}
            >
              <DropdownSelect
                id="project-pm"
                label="ผู้จัดการโปรเจค (PM)"
                value={values.pm_user_id}
                options={pmOptions.map((person) => ({ label: `${person.first_name} ${person.last_name}`, value: String(person.user_id) }))}
                onChange={(value) => set("pm_user_id", value)}
                placeholder={isLoadingAssignees ? "กำลังโหลดรายชื่อ…" : pmOptions.length === 0 ? "ไม่พบ PM ที่ active" : "กรุณาเลือก"}
                showLabel={false}
                hasError={!!errors.pm_user_id}
                describedBy={`project-pm-hint${errors.pm_user_id ? " project-pm-error" : ""}`}
                disabled={isSubmitting || isLoadingAssignees}
                className="w-full"
              />
            </Field>

            <Field
              id="project-pc"
              label="ผู้ประสานงานโปรเจค (PC)"
              subLabel="Responsible PC"
              required
              error={errors.pc_user_id}
            >
              <DropdownSelect
                id="project-pc"
                label="ผู้ประสานงานโปรเจค (PC)"
                value={values.pc_user_id}
                options={pcOptions.map((person) => ({ label: `${person.first_name} ${person.last_name}`, value: String(person.user_id) }))}
                onChange={(value) => set("pc_user_id", value)}
                placeholder={isLoadingAssignees ? "กำลังโหลดรายชื่อ…" : pcOptions.length === 0 ? "ไม่พบ PC ที่ active" : "กรุณาเลือก"}
                showLabel={false}
                hasError={!!errors.pc_user_id}
                describedBy={`project-pc-hint${errors.pc_user_id ? " project-pc-error" : ""}`}
                disabled={isSubmitting || isLoadingAssignees}
                className="w-full"
              />
            </Field>
          </div>

          {/* Department */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field id="project-department" label="หน่วยงาน / แผนก" subLabel="Department">
              <DropdownSelect
                id="project-department"
                label="หน่วยงาน / แผนก"
                value={values.department}
                options={MOCK_DEPT.map((department) => ({ label: department.label, value: department.id }))}
                onChange={(value) => set("department", value)}
                placeholder="กรุณาเลือก"
                showLabel={false}
                describedBy="project-department-hint"
                disabled={isSubmitting}
                className="w-full"
              />
            </Field>
          </div>

          <h2 className="border-t border-border pt-8 text-xl font-medium leading-7">รายละเอียดเพิ่มเติม</h2>
          {/* Row 4: Description — full width */}
          <Field id="project-description" label="หมายเหตุ" subLabel="Description">
            <textarea
              id="project-description"
              aria-describedby="project-description-hint"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="ระบุ รายละเอียดเพิ่มเติมของโปรเจค (ถ้ามี)"
              rows={4}
              className="form-input min-h-28 resize-y"
              disabled={isSubmitting}
            />
          </Field>

          {/* Submit error */}
          {assigneeError && (
            <div role="alert" className="notice-error flex flex-wrap items-center gap-3">
              <span className="flex-1">{assigneeError}</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsLoadingAssignees(true);
                  setAssigneeReload((value) => value + 1);
                }}
              >
                ลองโหลดใหม่
              </button>
            </div>
          )}
          {submitError && (
            <div role="alert" className="notice-error">
              {submitError}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => router.push("/project")}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            <LuArrowLeft size={16} aria-hidden />
            ย้อนกลับ
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            <LuCheck size={16} aria-hidden />
            {isSubmitting ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}
