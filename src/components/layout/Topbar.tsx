"use client";

import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
      {/* Left — hamburger */}
      <button
        onClick={onMenuClick}
        className="rounded p-1.5 text-text-secondary transition hover:bg-bg-page hover:text-text-primary"
        aria-label="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M2 4h14M2 9h14M2 14h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Right — actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <button
          className="rounded p-1.5 text-text-secondary transition hover:bg-bg-page hover:text-text-primary"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M9 2a5.5 5.5 0 0 0-5.5 5.5v2.25L2 12h14l-1.5-2.25V7.5A5.5 5.5 0 0 0 9 2zM7 14a2 2 0 0 0 4 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Avatar + dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-bg-page"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="User menu"
            disabled={isLoggingOut}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white select-none"
              aria-hidden
            >
              {initials}
            </div>
            {user && (
              <div className="hidden flex-col leading-none text-left sm:flex">
                <span className="text-sm font-medium text-text-primary">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-xs text-text-secondary">{user.role_code}</span>
              </div>
            )}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-white py-1 shadow-lg"
            >
              {user && (
                <div className="border-b border-border px-3 py-2 sm:hidden">
                  <p className="text-sm font-medium text-text-primary">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-text-secondary">{user.role_code}</p>
                </div>
              )}
              <button
                role="menuitem"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger transition hover:bg-red-50 disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9 10l3-3-3-3M12 7H5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {isLoggingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
