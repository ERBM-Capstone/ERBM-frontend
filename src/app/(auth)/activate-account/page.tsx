"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

type PageState =
  | { kind: "ready"; token: string }
  | { kind: "invalid" }
  | { kind: "success" }
  | { kind: "error"; message: string };

function ActivateAccountForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [submitted, setSubmitted] = useState<
    { kind: "success" } | { kind: "error"; message: string } | null
  >(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resolveState(): PageState {
    if (submitted) return submitted;
    if (!token) return { kind: "invalid" };
    return { kind: "ready", token };
  }

  const pageState = resolveState();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pageState.kind !== "ready") return;

    if (password !== confirm) {
      setSubmitted({ kind: "error", message: "รหัสผ่านไม่ตรงกัน" });
      return;
    }
    if (password.length < 8) {
      setSubmitted({ kind: "error", message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/activation/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pageState.token, password }),
      });

      if (res.ok) {
        setSubmitted({ kind: "success" });
      } else {
        const json = await res.json().catch(() => ({}));
        setSubmitted({
          kind: "error",
          message: json.message ?? "ลิงก์เปิดใช้งานไม่ถูกต้องหรือหมดอายุแล้ว",
        });
      }
    } catch {
      setSubmitted({ kind: "error", message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pageState.kind === "success") {
    return (
      <div aria-live="polite" className="space-y-6">
        <div className="notice-success">
          <p className="text-sm font-medium text-status-active-text">เปิดใช้งานบัญชีสำเร็จ!</p>
          <p className="mt-1 text-sm text-status-active-text">
            ตั้งรหัสผ่านเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบได้แล้ว
          </p>
        </div>
        <button
          onClick={() => router.replace("/login")}
          className="btn-primary w-full"
        >
          ไปยังหน้าเข้าสู่ระบบ
        </button>
      </div>
    );
  }

  if (pageState.kind === "invalid") {
    return (
      <div aria-live="polite" className="notice-error">
        <p className="text-sm font-medium text-danger-text">ไม่พบโทเค็นเปิดใช้งาน</p>
        <p className="mt-1 text-sm text-danger-text">
          กรุณาตรวจสอบลิงก์จากอีเมลหรือติดต่อผู้ดูแลระบบ
        </p>
      </div>
    );
  }

  const formError = pageState.kind === "error" ? pageState.message : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-text-primary">
          รหัสผ่านใหม่
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-medium text-text-primary">
          ยืนยันรหัสผ่าน
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="form-input"
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          disabled={isSubmitting}
        />
      </div>

      {formError && (
        <div role="alert" className="notice-error">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !password || !confirm}
        className="btn-primary w-full"
      >
        {isSubmitting ? "กำลังเปิดใช้งาน…" : "เปิดใช้งานบัญชี"}
      </button>
    </form>
  );
}

export default function ActivateAccountPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold leading-8 text-text-primary">
          ตั้งรหัสผ่าน
        </h1>
        <p className="text-sm text-text-secondary">
          ตั้งรหัสผ่านเพื่อเปิดใช้งานบัญชี ERBM ของคุณ
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-text-secondary" aria-live="polite">กำลังโหลด…</p>}>
        <ActivateAccountForm />
      </Suspense>
    </div>
  );
}
