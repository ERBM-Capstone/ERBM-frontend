"use client";

import { useAuth } from "@/lib/auth/context";
import { useCallback, useEffect, useState } from "react";
import type { Project, ProjectMeta, ProjectListParams, ProjectStatus } from "@/lib/project/types";
import ProjectTable from "./ProjectTable";

const STATUS_OPTIONS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "ทั้งหมด", value: "" },
  { label: "ใช้งาน", value: "ACTIVE" },
  { label: "ปิด", value: "CLOSED" },
];

export default function ProjectPage() {
  const { getToken, user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<ProjectMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState<ProjectListParams>({
    page: 1,
    page_size: 20,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");

  const fetchProjects = useCallback(async (p: ProjectListParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const qs = new URLSearchParams();
      if (p.q) qs.set("q", p.q);
      if (p.status) qs.set("status", p.status);
      if (p.page) qs.set("page", String(p.page));
      if (p.page_size) qs.set("page_size", String(p.page_size));

      const res = await fetch(`/api/projects?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setProjects(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Fetch on param change
  useEffect(() => {
    fetchProjects(params);
  }, [params, fetchProjects]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setParams((prev) => ({ ...prev, q: search || undefined, page: 1 }));
  }

  function handleStatusChange(value: ProjectStatus | "") {
    setStatusFilter(value);
    setParams((prev) => ({ ...prev, status: value || undefined, page: 1 }));
  }

  const canCreate = user?.role_code === "ADMIN";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Project List</h1>
        <p className="mt-0.5 text-sm text-text-secondary">รายการโครงการทั้งหมดในระบบ</p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">ค้นหา</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา Project Code / ชื่อโปรเจค"
              className="h-9 w-72 rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </form>

        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">สถานะ</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus | "")}
              className="h-9 w-36 appearance-none rounded-lg border border-border bg-white pl-3 pr-8 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-text-secondary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        {/* PM filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">ผู้จัดการโปรเจค (PM)</label>
          <div className="relative">
            <select
              disabled
              className="h-9 w-44 appearance-none rounded-lg border border-border bg-white pl-3 pr-8 text-sm text-text-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option>ทั้งหมด</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-text-secondary">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Create button */}
        {canCreate && (
          <button
            onClick={() => {/* TODO: open create project modal/page */}}
            className="flex h-9 items-center gap-2 rounded-lg bg-bg-button px-4 text-sm font-medium text-white transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            สร้างโปรเจค
          </button>
        )}
      </div>

      {/* Table */}
      <ProjectTable
        projects={projects}
        isLoading={isLoading}
        error={error}
        canEdit={canCreate}
      />

      {/* Pagination summary */}
      {meta && !isLoading && !error && (
        <p className="text-sm text-text-secondary">
          แสดง {(meta.page - 1) * meta.per_page + 1}–
          {Math.min(meta.page * meta.per_page, meta.total)} จาก {meta.total} รายการ
        </p>
      )}
    </div>
  );
}
