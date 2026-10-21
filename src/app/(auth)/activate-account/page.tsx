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
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <p className="text-sm font-medium text-green-800">เปิดใช้งานบัญชีสำเร็จ!</p>
          <p className="mt-1 text-sm text-green-700">
            ตั้งรหัสผ่านเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบได้แล้ว
          </p>
        </div>
        <button
          onClick={() => router.replace("/login")}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-zinc-900/30"
        >
          ไปยังหน้าเข้าสู่ระบบ
        </button>
      </div>
    );
  }

  if (pageState.kind === "invalid") {
    return (
      <div aria-live="polite" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <p className="text-sm font-medium text-red-800">ไม่พบโทเค็นเปิดใช้งาน</p>
        <p className="mt-1 text-sm text-red-700">
          กรุณาตรวจสอบลิงก์จากอีเมลหรือติดต่อผู้ดูแลระบบ
        </p>
      </div>
    );
  }

  const formError = pageState.kind === "error" ? pageState.message : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
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
          className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700">
          ยืนยันรหัสผ่าน
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50"
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          disabled={isSubmitting}
        />
      </div>

      {formError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !password || !confirm}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-zinc-900/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "กำลังเปิดใช้งาน…" : "เปิดใช้งานบัญชี"}
      </button>
    </form>
  );
}

export default function ActivateAccountPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          ตั้งรหัสผ่าน
        </h1>
        <p className="text-sm text-zinc-500">
          ตั้งรหัสผ่านเพื่อเปิดใช้งานบัญชี ERBM ของคุณ
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-zinc-400" aria-live="polite">กำลังโหลด…</p>}>
        <ActivateAccountForm />
      </Suspense>
    </div>
  );
}
