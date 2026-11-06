"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { LuArrowLeft, LuCheck, LuChevronRight } from "react-icons/lu";
import { useAuth } from "@/lib/auth/context";

/* ─── Mock data (replace with API when available) ─── */
const MOCK_PM = [
  { user_id: 1, label: "Chavapon S." },
  { user_id: 2, label: "Apinya W." },
  { user_id: 3, label: "Natthapol K." },
];
const MOCK_PC = [
  { user_id: 4, label: "Siriporn T." },
  { user_id: 5, label: "Wanchai P." },
  { user_id: 6, label: "Rattana M." },
];
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

const selectCls = (hasError: boolean) =>
  `${inputCls(hasError)} appearance-none pr-10`;

const ChevronDown = () => (
  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-secondary">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

/* ─── Page ─── */
interface FormValues {
  name: string;
  budget: string;
  pm_user_id: string;
  pc_user_id: string;
  department: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface FormErrors {
  name?: string;
  budget?: string;
  pm_user_id?: string;
  pc_user_id?: string;
}

const FIELD_IDS: Record<keyof FormErrors, string> = {
  name: "project-name",
  budget: "project-budget",
  pm_user_id: "project-pm",
  pc_user_id: "project-pc",
};

export default function CreateProjectPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<FormValues>({
    name: "",
    budget: "",
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

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!values.name.trim()) e.name = "กรุณาระบุชื่อโปรเจค";
    if (!values.budget.trim()) {
      e.budget = "กรุณาระบุงบประมาณ";
    } else if (!/^\d+(\.\d{1,2})?$/.test(values.budget.trim())) {
      e.budget = "งบประมาณต้องเป็นตัวเลข เช่น 150000.00";
    }
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

      // Format budget as decimal string e.g. "150000.00"
      const budgetNum = parseFloat(values.budget.trim());
      const budgetStr = budgetNum.toFixed(2);

      const body: Record<string, unknown> = {
        name: values.name.trim(),
        budget: budgetStr,
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

          {/* Row 1: Project Name + Budget */}
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

            <Field
              id="project-budget"
              label="งบประมาณ"
              subLabel="Budget (THB)"
              required
              error={errors.budget}
            >
              <input
                type="text"
                inputMode="decimal"
                id="project-budget"
                required
                aria-invalid={!!errors.budget}
                aria-describedby={`project-budget-hint${errors.budget ? " project-budget-error" : ""}`}
                value={values.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="เช่น 150000.00"
                className={inputCls(!!errors.budget)}
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
              <div className="relative">
                <select
                  id="project-pm"
                  required
                  aria-invalid={!!errors.pm_user_id}
                  aria-describedby={`project-pm-hint${errors.pm_user_id ? " project-pm-error" : ""}`}
                  value={values.pm_user_id}
                  onChange={(e) => set("pm_user_id", e.target.value)}
                  className={selectCls(!!errors.pm_user_id)}
                  disabled={isSubmitting}
                >
                  <option value="">กรุณาเลือก</option>
                  {MOCK_PM.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </Field>

            <Field
              id="project-pc"
              label="ผู้ประสานงานโปรเจค (PC)"
              subLabel="Responsible PC"
              required
              error={errors.pc_user_id}
            >
              <div className="relative">
                <select
                  id="project-pc"
                  required
                  aria-invalid={!!errors.pc_user_id}
                  aria-describedby={`project-pc-hint${errors.pc_user_id ? " project-pc-error" : ""}`}
                  value={values.pc_user_id}
                  onChange={(e) => set("pc_user_id", e.target.value)}
                  className={selectCls(!!errors.pc_user_id)}
                  disabled={isSubmitting}
                >
                  <option value="">กรุณาเลือก</option>
                  {MOCK_PC.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </Field>
          </div>

          {/* Department */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field id="project-department" label="หน่วยงาน / แผนก" subLabel="Department">
              <div className="relative">
                <select
                  id="project-department"
                  aria-describedby="project-department-hint"
                  value={values.department}
                  onChange={(e) => set("department", e.target.value)}
                  className={selectCls(false)}
                  disabled={isSubmitting}
                >
                  <option value="">กรุณาเลือก</option>
                  {MOCK_DEPT.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
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
