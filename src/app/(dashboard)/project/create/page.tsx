"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImCheckmark } from "react-icons/im";
import { IoArrowBack } from "react-icons/io5";
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
  label: string;
  subLabel: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}
function Field({ label, subLabel, required, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {required && <span className="text-danger text-sm font-medium">*</span>}
      </div>
      <span className="text-xs text-text-secondary -mt-0.5">{subLabel}</span>
      {children}
      {error && (
        <p role="alert" className="text-xs text-danger mt-0.5">{error}</p>
      )}
    </div>
  );
}

/* ─── Shared input/select styles ─── */
const inputCls = (hasError: boolean) =>
  [
    "h-10 w-full rounded-lg border bg-white px-3.5 text-sm text-text-primary placeholder:text-text-secondary",
    "transition focus:outline-none focus:ring-2",
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-border focus:border-accent focus:ring-accent/20",
  ].join(" ");

const selectCls = (hasError: boolean) =>
  [
    "h-10 w-full appearance-none rounded-lg border bg-white pl-3.5 pr-9 text-sm",
    "transition focus:outline-none focus:ring-2",
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20 text-text-primary"
      : "border-border focus:border-accent focus:ring-accent/20 text-text-primary",
  ].join(" ");

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

export default function CreateProjectPage() {
  const router = useRouter();
  const { getToken } = useAuth();

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
    <div className="space-y-0">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-2xl font-semibold text-text-primary">สร้างโปรเจค</h1>
        <p className="mt-0.5 text-sm text-text-secondary">กรอกข้อมูลเพื่อสร้างโปรเจคใหม่ในระบบ</p>
        <p className="mt-2 text-xs text-text-secondary">
          <span className="text-danger font-medium">*</span> จำเป็นต้องกรอกข้อมูล
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="py-6 space-y-6">

          {/* Row 1: Project Name + Budget */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="ชื่อโปรเจค"
              subLabel="Project Name"
              required
              error={errors.name}
            >
              <input
                type="text"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="ระบุ ชื่อโปรเจค"
                maxLength={255}
                className={inputCls(!!errors.name)}
                disabled={isSubmitting}
              />
            </Field>

            <Field
              label="งบประมาณ"
              subLabel="Budget (THB)"
              required
              error={errors.budget}
            >
              <input
                type="text"
                inputMode="decimal"
                value={values.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="เช่น 150000.00"
                className={inputCls(!!errors.budget)}
                disabled={isSubmitting}
              />
            </Field>
          </div>

          {/* Row 2: PM + PC */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field
              label="ผู้จัดการโปรเจค (PM)"
              subLabel="Responsible PM"
              required
              error={errors.pm_user_id}
            >
              <div className="relative">
                <select
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
              label="ผู้ประสานงานโปรเจค (PC)"
              subLabel="Responsible PC"
              required
              error={errors.pc_user_id}
            >
              <div className="relative">
                <select
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

          {/* Row 3: Department + empty */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="หน่วยงาน / แผนก" subLabel="Department">
              <div className="relative">
                <select
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
            {/* Right column intentionally empty per Figma */}
            <div />
          </div>

          {/* Row 4: Description — full width */}
          <Field label="หมายเหตุ" subLabel="Description">
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="ระบุ รายละเอียดเพิ่มเติมของโปรเจค (ถ้ามี)"
              rows={4}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none disabled:opacity-50"
              disabled={isSubmitting}
            />
          </Field>

          {/* Submit error */}
          {submitError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {submitError}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={() => router.push("/project")}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium text-text-primary transition hover:bg-bg-page focus:outline-none focus:ring-2 focus:ring-border disabled:opacity-50"
          >
            <IoArrowBack size={15} aria-hidden />
            ย้อนกลับ
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-bg-button px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ImCheckmark size={13} aria-hidden />
            {isSubmitting ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}
