"use client";

import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span role="status" className="text-sm text-text-secondary">กำลังโหลด…</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="fixed left-4 top-2 z-50 -translate-y-20 rounded-full bg-accent px-4 py-2 text-white focus:translate-y-0">ข้ามไปยังเนื้อหา</a>
      <Topbar collapsed={collapsed} mobileOpen={mobileOpen} onDesktopMenuClick={() => setCollapsed((prev) => !prev)} onMobileMenuClick={() => setMobileOpen(true)} />
      <div className="flex">
        <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={closeMobile} />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-10 lg:py-9">
          <div className="mx-auto w-full max-w-[2200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
