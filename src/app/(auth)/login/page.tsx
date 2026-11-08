"use client";

import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/worklist");
  }, [isLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/worklist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading || user) {
    return (
      <div className="flex min-h-48 items-center justify-center" role="status">
        <span className="text-sm text-text-secondary">กำลังตรวจสอบการเข้าสู่ระบบ…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold leading-8 text-text-primary">
          เข้าสู่ระบบ ERBM
        </h1>
        <p className="text-sm text-text-secondary">
          กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text-primary"
          >
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="กรอกอีเมล"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text-primary"
          >
            รหัสผ่าน
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            placeholder="กรอกรหัสผ่าน"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="notice-error"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !email || !password}
          className="btn-primary w-full"
        >
          {isSubmitting ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>

      <p className="text-center text-xs text-text-secondary">
        ยังไม่มีบัญชี?{" "}
        <span className="text-text-secondary">
          ตรวจสอบอีเมลสำหรับลิงก์เปิดใช้งาน
        </span>
      </p>
    </div>
  );
}
