"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LuFolderClosed, LuListTodo, LuX } from "react-icons/lu";
import Brand from "./Brand";
import { useAuth } from "@/lib/auth/context";
import { roleLabel } from "@/lib/auth/role-label";

const NAV_ITEMS = [
  { label: "Worklist", href: "/worklist", icon: LuListTodo },
  { label: "Project", href: "/project", icon: LuFolderClosed },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}

function Navigation({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูหลัก" className="px-4 py-6">
      <ul className="space-y-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? label : undefined}
                title={collapsed ? label : undefined}
                className={`relative flex min-h-12 items-center rounded-lg transition-colors ${collapsed ? "justify-center px-1 py-3" : "gap-3 px-4 py-3"} ${active ? "bg-surface font-bold text-text-primary" : "text-text-primary hover:bg-surface"}`}
              >
                {active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 bg-primary" aria-hidden />}
                <Icon size={18} strokeWidth={active ? 2.2 : 1.7} aria-hidden />
                <span className={collapsed ? "sr-only" : "text-sm"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();

    const media = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop() {
      if (media.matches && dialog?.open) onClose();
    }
    media.addEventListener("change", closeOnDesktop);
    const previousOverflow = document.body.style.overflow;
    if (mobileOpen) document.body.style.overflow = "hidden";

    return () => {
      media.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, onClose]);

  return (
    <>
      <aside
        id="desktop-navigation"
        className={`sticky top-[72px] hidden h-[calc(100dvh-72px)] shrink-0 flex-col overflow-y-auto border-r border-border bg-white lg:flex ${collapsed ? "w-[72px]" : "w-[216px]"}`}
      >
        <Navigation collapsed={collapsed} />
        {!collapsed && (
          <p className="mt-auto px-4 pb-6 text-xs leading-5 text-text-secondary">{user ? roleLabel(user.role_code) : "ERBM"}</p>
        )}
      </aside>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-label="เมนูหลัก"
        onCancel={onClose}
        onClose={onClose}
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-60 max-w-[85vw] border-0 bg-white p-0 text-text-primary backdrop:bg-black/40 lg:hidden"
      >
        <div className="min-h-full" onClick={(event) => event.stopPropagation()}>
          <div className="flex h-[72px] items-center justify-between px-4">
            <Brand />
            <button type="button" onClick={onClose} className="icon-button" aria-label="ปิดเมนู">
              <LuX size={20} aria-hidden />
            </button>
          </div>
          <Navigation onNavigate={onClose} />
        </div>
      </dialog>
    </>
  );
}
