"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuCheck, LuChevronDown, LuPlus, LuSearch, LuX } from "react-icons/lu";
import { useAuth } from "@/lib/auth/context";
import type { Project, ProjectMeta, ProjectListParams, ProjectStatus } from "@/lib/project/types";
import { fetchAllPages } from "@/lib/project/fetch-all-pages";
import ProjectTable from "./ProjectTable";

interface ActiveAdvance {
  id: number;
  amount: string;
  project: { id: number };
}

const STATUS_OPTIONS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "ใช้งาน", value: "ACTIVE" },
  { label: "ปิด", value: "CLOSED" },
];

function ProjectList({ initialQuery, created }: { initialQuery: string; created: boolean }) {
  const { getToken, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(created ? "สร้างโปรเจคสำเร็จ" : null);
  const [params, setParams] = useState<ProjectListParams>({ page: 1, page_size: 20, q: initialQuery || undefined });
  const [search, setSearch] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [pmFilter, setPmFilter] = useState("");
  const [pcFilter, setPcFilter] = useState("");
  const [advanceFilter, setAdvanceFilter] = useState<"" | "yes" | "no">("");
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    if (!successMsg) return;
    const timeout = window.setTimeout(() => setSuccessMsg(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMsg]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadProjects() {
      const timeout = window.setTimeout(() => controller.abort(), 30_000);
      try {
        const token = await getToken();
        if (!active) return;
        if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        const projectFilters = new URLSearchParams();
        if (params.q) projectFilters.set("q", params.q);
        if (params.status) projectFilters.set("status", params.status);
        const advanceFilters = new URLSearchParams({ status: "ACTIVE" });
        const [allProjects, activeAdvances] = await Promise.all([
          fetchAllPages<Project>("/api/projects", projectFilters, token, controller.signal),
          fetchAllPages<ActiveAdvance>("/api/advances", advanceFilters, token, controller.signal),
        ]);
        const advancesByProject = new Map(activeAdvances.map((advance) => [advance.project.id, advance]));
        const projectsWithAdvances = allProjects.map((project) => ({
          ...project,
          active_advance: advancesByProject.get(project.id)
            ? { id: advancesByProject.get(project.id)!.id, amount: advancesByProject.get(project.id)!.amount }
            : null,
        }));
        if (active) {
          setProjects(projectsWithAdvances);
        }
      } catch (err) {
        if (active) {
          setError(
            controller.signal.aborted
              ? "ใช้เวลาโหลดนานเกินไป กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
              : err instanceof Error
                ? err.message
                : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
          );
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setIsLoading(false);
      }
    }

    loadProjects();
    return () => {
      active = false;
      controller.abort();
    };
  }, [params.q, params.status, getToken, reloadVersion]);

  function updateParams(changes: Partial<ProjectListParams>) {
    setIsLoading(true);
    setError(null);
    setParams((prev) => ({ ...prev, ...changes }));
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = search.trim() || undefined;
    if (query === params.q) setReloadVersion((version) => version + 1);
    updateParams({ q: query, page: 1 });
  }

  function handleStatusChange(value: ProjectStatus | "") {
    setStatusFilter(value);
    if ((value || undefined) === params.status) setReloadVersion((version) => version + 1);
    updateParams({ status: value || undefined, page: 1 });
  }

  const pmOptions = Array.from(new Map(projects.map((project) => [project.pm.user_id, project.pm])).values());
  const pcOptions = Array.from(new Map(projects.flatMap((project) => project.pc ? [[project.pc.user_id, project.pc] as const] : [])).values());
  const filteredProjects = projects.filter((project) => {
    if (pmFilter && String(project.pm.user_id) !== pmFilter) return false;
    if (pcFilter && String(project.pc?.user_id ?? "") !== pcFilter) return false;
    if (advanceFilter === "yes" && !project.active_advance) return false;
    if (advanceFilter === "no" && project.active_advance) return false;
    return true;
  });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const currentPage = Math.min(params.page ?? 1, pageCount);
  const meta: ProjectMeta = { page: currentPage, per_page: pageSize, total: filteredProjects.length };
  const pageProjects = filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const canCreate = user?.role_code === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-8">Project List</h1>
          <p className="mt-1 text-sm text-text-secondary">รายการโครงการทั้งหมดในระบบ</p>
        </div>
        {canCreate && <Link href="/project/create" className="btn-primary"><LuPlus size={18} aria-hidden />สร้างโปรเจค</Link>}
      </div>

      <div className="space-y-4 border-b border-border pb-5">
        <div role="group" aria-label="กรองตามสถานะ" className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ label, value }) => (
            <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => handleStatusChange(value)} className={`min-h-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${statusFilter === value ? "bg-accent text-white" : "bg-surface text-text-primary hover:bg-border"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <form onSubmit={handleSearch} role="search" aria-label="ค้นหาในรายการโครงการ" className="flex h-11 min-w-0 rounded-lg border border-border bg-surface transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/30 sm:col-span-2 lg:col-span-1">
            <label htmlFor="project-search" className="sr-only">รหัสหรือชื่อโครงการ</label>
            <input id="project-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="รหัส / ชื่อโครงการ" className="min-w-0 flex-1 rounded-l-lg bg-transparent px-4 text-base placeholder:text-text-secondary focus:outline-none focus-visible:outline-none sm:text-sm" />
            <button type="submit" className="flex w-12 shrink-0 items-center justify-center rounded-r-lg border-l border-border transition-colors hover:bg-border focus-visible:outline-none" aria-label="ค้นหาในรายการโครงการ"><LuSearch size={18} aria-hidden /></button>
          </form>
          <SelectFilter id="pm-filter" label="PM" value={pmFilter} options={[
            { label: "ทั้งหมด", value: "" },
            ...pmOptions.map((person) => ({ label: `${person.first_name} ${person.last_name}`, value: String(person.user_id) })),
          ]} onChange={(value) => { setPmFilter(value); setParams((previous) => ({ ...previous, page: 1 })); }} />
          <SelectFilter id="pc-filter" label="PC" value={pcFilter} options={[
            { label: "ทั้งหมด", value: "" },
            ...pcOptions.map((person) => ({ label: `${person.first_name} ${person.last_name}`, value: String(person.user_id) })),
          ]} onChange={(value) => { setPcFilter(value); setParams((previous) => ({ ...previous, page: 1 })); }} />
          <SelectFilter id="advance-filter" label="เงินทดรอง" value={advanceFilter} options={[
            { label: "ทั้งหมด", value: "" },
            { label: "มี", value: "yes" },
            { label: "ไม่มี", value: "no" },
          ]} onChange={(value) => { setAdvanceFilter(value as "" | "yes" | "no"); setParams((previous) => ({ ...previous, page: 1 })); }} />
        </div>
      </div>

      {successMsg && <div role="status" className="notice-success flex items-center gap-3"><LuCheck size={18} className="shrink-0" aria-hidden /><span className="flex-1">{successMsg}</span><button type="button" className="icon-button" onClick={() => setSuccessMsg(null)} aria-label="ปิดข้อความ"><LuX size={16} aria-hidden /></button></div>}

      <ProjectTable projects={pageProjects} isLoading={isLoading} error={error} canEdit={canCreate} onRetry={() => { setIsLoading(true); setError(null); setReloadVersion((version) => version + 1); }} />

      {meta && !isLoading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-xs text-text-secondary">
          <p role="status">แสดง {meta.total === 0 ? 0 : (meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} จาก {meta.total} รายการ</p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" disabled={currentPage <= 1} onClick={() => setParams((previous) => ({ ...previous, page: currentPage - 1 }))}>ก่อนหน้า</button>
            <button type="button" className="btn-secondary" disabled={currentPage * pageSize >= meta.total} onClick={() => setParams((previous) => ({ ...previous, page: currentPage + 1 }))}>ถัดไป</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openMenu(index = selectedIndex) {
    setActiveIndex(index);
    setOpen(true);
  }

  function chooseOption(option: { label: string; value: string }) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      setActiveIndex(nextIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative flex h-11 min-w-0 items-center gap-2 rounded-lg border px-3 transition-colors focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/30 ${value ? "border-accent bg-white" : "border-border bg-surface"} ${open ? "border-secondary ring-2 ring-secondary/30" : "hover:border-neutral"}`}>
      <span className="shrink-0 text-xs font-medium text-text-secondary" aria-hidden>{label}</span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={`กรองตาม ${label}: ${selectedOption.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowDown" ? selectedIndex : selectedIndex > 0 ? selectedIndex - 1 : options.length - 1);
          }
        }}
        className="flex h-full min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm text-text-primary focus-visible:outline-none"
      >
        <span className="truncate">{selectedOption.label}</span>
        <LuChevronDown size={14} className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div id={`${id}-options`} role="listbox" aria-label={`ตัวเลือก ${label}`} className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-menu">
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                ref={(element) => { optionRefs.current[index] = element; }}
                key={option.value || "all"}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={activeIndex === index ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                onClick={() => chooseOption(option)}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none ${selected ? "bg-surface font-medium text-text-primary" : "text-text-primary hover:bg-surface"}`}
              >
                <span className="truncate">{option.label}</span>
                {selected && <LuCheck size={16} className="shrink-0 text-accent" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const created = searchParams.get("success") === "created";
  return <ProjectList key={`${query}:${created}`} initialQuery={query} created={created} />;
}

export default function ProjectPage() {
  return <Suspense fallback={<p role="status" className="text-sm text-text-secondary">กำลังโหลดโครงการ…</p>}><ProjectContent /></Suspense>;
}
