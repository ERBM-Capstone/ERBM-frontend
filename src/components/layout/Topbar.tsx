"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { roleLabel } from "@/lib/auth/role-label";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuBell, LuChevronDown, LuLogOut, LuMenu, LuX } from "react-icons/lu";
import Brand from "./Brand";

interface TopbarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onDesktopMenuClick: () => void;
  onMobileMenuClick: () => void;
}

export default function Topbar({ collapsed, mobileOpen, onDesktopMenuClick, onMobileMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const notificationCloseRef = useRef<HTMLButtonElement>(null);

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (menuOpen) logoutButtonRef.current?.focus();
  }, [menuOpen]);

  useEffect(() => {
    if (notificationsOpen) notificationCloseRef.current?.focus();
  }, [notificationsOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setMenuOpen(false);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-border bg-white px-3 sm:px-6">
      <div className="flex shrink-0 items-center gap-3 sm:gap-8">
        <button type="button" onClick={onDesktopMenuClick} className="icon-button hidden! lg:inline-flex!" aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"} aria-expanded={!collapsed} aria-controls="desktop-navigation">
          <LuMenu size={18} aria-hidden />
        </button>
        <button type="button" onClick={onMobileMenuClick} className="icon-button lg:hidden!" aria-label="เปิดเมนู" aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          <LuMenu size={18} aria-hidden />
        </button>
        <Link href="/worklist" aria-label="ERBM หน้าหลัก"><Brand /></Link>
      </div>

      <div className="flex min-w-0 items-center gap-1 sm:gap-5">
        <div
          ref={notificationsRef} className="relative"
          onKeyDown={(event) => {
            if (event.key === "Escape") { setNotificationsOpen(false); notificationButtonRef.current?.focus(); }
          }}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setNotificationsOpen(false); }}
        >
          <button
            ref={notificationButtonRef} type="button" className="icon-button"
            aria-label="การแจ้งเตือน" aria-expanded={notificationsOpen} aria-controls="notification-panel"
            onClick={() => { setNotificationsOpen((previous) => !previous); setMenuOpen(false); }}
          >
            <LuBell size={20} strokeWidth={1.7} aria-hidden />
          </button>
          {notificationsOpen && (
            <div id="notification-panel" className="absolute right-0 top-full mt-3 w-64 rounded-lg border border-border bg-white p-4 shadow-menu sm:w-72">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium">การแจ้งเตือน</h2>
                <button ref={notificationCloseRef} type="button" className="icon-button" aria-label="ปิดการแจ้งเตือน" onClick={() => { setNotificationsOpen(false); notificationButtonRef.current?.focus(); }}><LuX size={16} aria-hidden /></button>
              </div>
              <p className="py-4 text-sm leading-6 text-text-secondary">การแจ้งเตือนยังไม่พร้อมใช้งาน</p>
            </div>
          )}
        </div>
        <div
          className="relative min-w-0" ref={menuRef}
          onKeyDown={(event) => { if (event.key === "Escape") { setMenuOpen(false); accountButtonRef.current?.focus(); } }}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false); }}
        >
          <button
            ref={accountButtonRef} type="button"
            onClick={() => { setMenuOpen((previous) => !previous); setNotificationsOpen(false); }}
            className="flex min-h-11 items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface sm:w-64 sm:px-2"
            aria-expanded={menuOpen} aria-controls="account-panel" aria-label="บัญชีผู้ใช้" disabled={isLoggingOut}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-text-primary" aria-hidden>{initials}</span>
            {user && (
              <span className="hidden min-w-0 flex-1 sm:block">
                <span className="block truncate text-sm font-medium leading-5">{user.first_name} {user.last_name}</span>
                <span className="mt-0.5 block text-xs leading-4 text-text-secondary">{roleLabel(user.role_code)}</span>
              </span>
            )}
            <LuChevronDown size={14} className="hidden shrink-0 text-neutral sm:block" aria-hidden />
          </button>
          {menuOpen && (
            <div id="account-panel" className="absolute right-0 top-full mt-3 w-64 rounded-lg border border-border bg-white py-2 shadow-menu">
              {user && (
                <div className="border-b border-border px-4 py-3">
                  <p className="break-words text-sm font-medium">{user.first_name} {user.last_name}</p>
                  <p className="mt-1 break-all text-xs text-text-secondary">{user.email}</p>
                  <p className="mt-2 text-xs text-text-secondary">{roleLabel(user.role_code)}</p>
                </div>
              )}
              <button ref={logoutButtonRef} type="button" onClick={handleLogout} disabled={isLoggingOut} className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface disabled:opacity-50">
                <LuLogOut size={18} aria-hidden />
                {isLoggingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
