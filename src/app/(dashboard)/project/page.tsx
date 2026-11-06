"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LuCheck, LuChevronDown, LuPlus, LuSearch, LuX } from "react-icons/lu";
import { useAuth } from "@/lib/auth/context";
import type { Project, ProjectMeta, ProjectListParams, ProjectStatus } from "@/lib/project/types";
import ProjectTable from "./ProjectTable";

const STATUS_OPTIONS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "ใช้งาน", value: "ACTIVE" },
  { label: "ปิด", value: "CLOSED" },
];

function ProjectList({ initialQuery, created }: { initialQuery: string; created: boolean }) {
  const { getToken, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(created ? "สร้างโปรเจคสำเร็จ" : null);
  const [params, setParams] = useState<ProjectListParams>({ page: 1, page_size: 20, q: initialQuery || undefined });
  const [search, setSearch] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadProjects() {
      try {
        const token = await getToken();
        if (!active) return;
        const qs = new URLSearchParams();
        if (params.q) qs.set("q", params.q);
        if (params.status) qs.set("status", params.status);
        if (params.page) qs.set("page", String(params.page));
        if (params.page_size) qs.set("page_size", String(params.page_size));
        const res = await fetch(`/api/projects?${qs.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? "โหลดข้อมูลไม่สำเร็จ");
        if (active) {
          setProjects(json.data ?? []);
          setMeta(json.meta ?? null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadProjects();
    return () => {
      active = false;
      controller.abort();
    };
  }, [params, getToken]);

  function updateParams(changes: Partial<ProjectListParams>) {
    setIsLoading(true);
    setError(null);
    setParams((prev) => ({ ...prev, ...changes }));
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    updateParams({ q: search.trim() || undefined, page: 1 });
  }

  function handleStatusChange(value: ProjectStatus | "") {
    setStatusFilter(value);
    updateParams({ status: value || undefined, page: 1 });
  }

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

      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 xl:flex-row xl:items-center">
        <div role="group" aria-label="กรองตามสถานะ" className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ label, value }) => (
            <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => handleStatusChange(value)} className={`min-h-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${statusFilter === value ? "bg-accent text-white" : "bg-surface text-text-primary hover:bg-border"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <form onSubmit={handleSearch} role="search" aria-label="ค้นหาในรายการโครงการ" className="flex h-11 min-w-0 sm:w-72">
            <label htmlFor="project-search" className="sr-only">รหัสหรือชื่อโครงการ</label>
            <input id="project-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="รหัส / ชื่อโครงการ" className="min-w-0 flex-1 border-b border-border bg-surface px-4 text-base placeholder:text-text-secondary focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:text-sm" />
            <button type="submit" className="flex w-12 shrink-0 items-center justify-center border-b border-border bg-surface transition-colors hover:bg-border" aria-label="ค้นหาในรายการโครงการ"><LuSearch size={18} aria-hidden /></button>
          </form>
          <div className="relative flex h-11 items-center bg-surface px-3 text-text-secondary" title="ตัวกรองผู้จัดการโครงการยังไม่พร้อมใช้งาน">
            <label htmlFor="pm-filter" className="mr-2 shrink-0 text-xs">PM</label>
            <select id="pm-filter" disabled className="h-full w-full appearance-none bg-transparent pr-7 text-sm disabled:cursor-not-allowed"><option>ทั้งหมด</option></select>
            <LuChevronDown size={14} className="pointer-events-none absolute right-3" aria-hidden />
          </div>
        </div>
      </div>

      {successMsg && <div role="status" className="notice-success flex items-center gap-3"><LuCheck size={18} className="shrink-0" aria-hidden /><span className="flex-1">{successMsg}</span><button type="button" className="icon-button" onClick={() => setSuccessMsg(null)} aria-label="ปิดข้อความ"><LuX size={16} aria-hidden /></button></div>}

      <ProjectTable projects={projects} isLoading={isLoading} error={error} canEdit={canCreate} onRetry={() => updateParams({})} />

      {meta && !isLoading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-xs text-text-secondary">
          <p role="status">แสดง {meta.total === 0 ? 0 : (meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} จาก {meta.total} รายการ</p>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" disabled={meta.page <= 1} onClick={() => updateParams({ page: meta.page - 1 })}>ก่อนหน้า</button>
            <button type="button" className="btn-secondary" disabled={meta.page * meta.per_page >= meta.total} onClick={() => updateParams({ page: meta.page + 1 })}>ถัดไป</button>
          </div>
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
