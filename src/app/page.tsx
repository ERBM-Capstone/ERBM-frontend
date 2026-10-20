"use client";

import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      if (!isLoading && !user) {
        router.replace("/login");
      }
    }
    redirect();
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-sm text-zinc-400">Loading…</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50">
      {/* Top nav */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
        <span className="text-sm font-semibold tracking-widest text-zinc-900 uppercase">
          ERBM
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">
            {user.first_name} {user.last_name}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {user.role_code}
          </span>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-xs font-medium tracking-widest text-zinc-400 uppercase">
          Welcome back
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {user.first_name} {user.last_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {user.email} · {user.position}
        </p>
      </div>
    </main>
  );
}
