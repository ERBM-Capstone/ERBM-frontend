import type { Project } from "@/lib/project/types";
import { ImEye, ImPencil } from "react-icons/im";

interface Props {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  canEdit: boolean;
}

function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectTable({ projects, isLoading, error, canEdit }: Props) {
  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-page">
            <th className="px-4 py-3 text-left font-medium text-text-secondary">
              รหัสโปรเจค<br />
              <span className="text-xs font-normal">Project Code</span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">
              ชื่อโปรเจค<br />
              <span className="text-xs font-normal">Project Name</span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">
              ผู้จัดการโปรเจค<br />
              <span className="text-xs font-normal">Project Manager</span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">
              ผู้ประสานงาน<br />
              <span className="text-xs font-normal">Project Coordinator</span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">
              สถานะ<br />
              <span className="text-xs font-normal">Status</span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">
              มี Advance ที่ Active<br />
              <span className="text-xs font-normal">Advance</span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-text-secondary">
              วันที่สร้าง<br />
              <span className="text-xs font-normal">Created Date</span>
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-border" />
                  </td>
                ))}
              </tr>
            ))
          ) : projects.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-text-secondary">
                ไม่พบโครงการ
              </td>
            </tr>
          ) : (
            projects.map((project) => (
              <ProjectRow key={project.id} project={project} canEdit={canEdit} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProjectRow({ project, canEdit }: { project: Project; canEdit: boolean }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-bg-page/60 transition-colors">
      <td className="px-4 py-3 font-medium text-text-primary">{project.project_code}</td>
      <td className="px-4 py-3 text-text-primary">{project.name}</td>
      <td className="px-4 py-3 text-text-primary">
        {project.pm.first_name} {project.pm.last_name.charAt(0)}.
      </td>
      <td className="px-4 py-3 text-text-primary">
        {project.pc
          ? `${project.pc.first_name} ${project.pc.last_name.charAt(0)}.`
          : <span className="text-text-secondary">—</span>}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={project.status} />
      </td>
      <td className="px-4 py-3">
        {project.active_advance ? (
          <div className="flex items-center gap-1.5">
            <span className="text-success text-base leading-none">●</span>
            <div className="leading-tight">
              <p className="text-xs text-text-secondary">มี</p>
              <p className="text-sm font-medium text-text-primary">
                ฿{Number(project.active_advance.amount).toLocaleString("th-TH")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-danger text-base leading-none">●</span>
            <span className="text-xs text-text-secondary">ไม่มี</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-text-secondary">{formatThaiDate(project.created_at ?? project.start_date)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            aria-label={`ดูโครงการ ${project.project_code}`}
            className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-bg-button text-white transition hover:bg-accent"
          >
            <ImEye size={18} aria-hidden />
          </button>
          {canEdit && (
            <button
              aria-label={`แก้ไขโครงการ ${project.project_code}`}
              className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-bg-button text-white transition hover:bg-accent"
            >
              <ImPencil size={18} aria-hidden />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: "ACTIVE" | "CLOSED" }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center rounded-full bg-status-active-bg px-2.5 py-0.5 text-xs font-medium text-status-active-text">
        ใช้งาน
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-status-closed-bg px-2.5 py-0.5 text-xs font-medium text-status-closed-text">
      ปิด
    </span>
  );
}
