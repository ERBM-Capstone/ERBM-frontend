"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Worklist",
    href: "/worklist",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M2 4h12M2 8h8M2 12h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Project",
    href: "/project",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect
          x="1.5"
          y="3.5"
          width="13"
          height="10"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path d="M5 8.5h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-[180px] flex-col border-r border-border bg-white transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:translate-x-0",
        ].join(" ")}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            {/* Sense Infotech logo mark — simplified SVG */}
            <SenseLogo />
            <div className="leading-none">
              <span className="block text-sm font-bold text-text-primary">Sense</span>
              <span className="block text-[10px] text-text-secondary">Infotech</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-secondary transition hover:bg-bg-page hover:text-text-primary lg:hidden"
            aria-label="Close sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5" role="list">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-bg-button text-white"
                        : "text-text-secondary hover:bg-bg-page hover:text-text-primary",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

function SenseLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16 16-7.163 16-16S28.837 4 20 4z"
        fill="#f5f5f5"
      />
      <path
        d="M26 14c0-3.314-2.686-6-6-6s-6 2.686-6 6c0 2.21 1.194 4.144 2.97 5.196C14.194 20.248 13 22.182 13 24.4c0 .884.717 1.6 1.6 1.6.884 0 1.6-.716 1.6-1.6 0-2.097 1.578-3.82 3.6-4.072V26c0 .884.716 1.6 1.6 1.6.883 0 1.6-.716 1.6-1.6v-4.232A5.997 5.997 0 0 0 26 16.4V14z"
        fill="#C0392B"
      />
      <path
        d="M20 8c-3.314 0-6 2.686-6 6v2.4a5.997 5.997 0 0 0 4.6 5.832V26c0 .884.716 1.6 1.6 1.6.883 0 1.6-.716 1.6-1.6v-3.872c2.022.252 3.6 1.975 3.6 4.072 0 .884.716 1.6 1.6 1.6.883 0 1.6-.716 1.6-1.6 0-2.218-1.194-4.152-2.97-5.204C26.806 18.144 28 16.21 28 14c0-3.314-2.686-6-6-6h-2z"
        fill="#8B1A1A"
      />
    </svg>
  );
}
