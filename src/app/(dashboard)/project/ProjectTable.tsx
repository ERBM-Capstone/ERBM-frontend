import type { Project } from "@/lib/project/types";
import { LuBriefcaseBusiness, LuCircleAlert, LuEye, LuPencil, LuRotateCw } from "react-icons/lu";

interface Props {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  canEdit: boolean;
  onRetry: () => void;
}

function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

const HEADERS = ["รหัสโปรเจค", "ชื่อโปรเจค", "ผู้จัดการ (PM)", "ผู้ประสานงาน (PC)", "สถานะ", "เงินทดรองที่ใช้งาน", "วันที่สร้าง"];

export default function ProjectTable({ projects, isLoading, error, canEdit, onRetry }: Props) {
  if (error) {
    return (
      <div className="notice-error flex flex-wrap items-center gap-3">
        <LuCircleAlert size={20} className="shrink-0" aria-hidden />
        <p role="alert" className="min-w-0 flex-1 break-words">{error}</p>
        <button type="button" onClick={onRetry} className="btn-secondary"><LuRotateCw size={16} aria-hidden />ลองอีกครั้ง</button>
      </div>
    );
  }

  if (!isLoading && projects.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-4 py-12 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-neutral"><LuBriefcaseBusiness size={26} strokeWidth={1.5} aria-hidden /></span>
        <h2 className="text-base font-medium">ไม่พบโครงการ</h2>
        <p className="mt-2 text-sm text-text-secondary">ลองเปลี่ยนคำค้นหาหรือสถานะที่เลือก</p>
      </div>
    );
  }

  return (
    <div role="region" aria-label="รายการโครงการ เลื่อนแนวนอนเพื่อดูคอลัมน์เพิ่มเติม" tabIndex={0} className="overflow-x-auto" aria-busy={isLoading}>
      {isLoading && <p role="status" className="sr-only">กำลังโหลดโครงการ</p>}
      <table className="w-full min-w-[960px] text-sm">
        <caption className="sr-only">รายการโครงการและผู้รับผิดชอบ</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-text-secondary">
            {HEADERS.map((label) => <th key={label} scope="col" className="whitespace-nowrap px-3 pb-4 font-medium first:pl-0">{label}</th>)}
            <th scope="col" className="px-3 pb-4"><span className="sr-only">การดำเนินการ</span></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border" aria-hidden>
              {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-3 py-6 first:pl-0"><div className="h-4 animate-pulse rounded bg-surface" /></td>)}
            </tr>
          )) : projects.map((project) => <ProjectRow key={project.id} project={project} canEdit={canEdit} />)}
        </tbody>
      </table>
    </div>
  );
}

function ProjectRow({ project, canEdit }: { project: Project; canEdit: boolean }) {
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-surface/60">
      <td className="py-5 pr-3 align-top text-xs font-medium whitespace-nowrap">{project.project_code}</td>
      <td className="min-w-48 max-w-80 px-3 py-5 align-top"><p className="line-clamp-2 font-medium leading-5" title={project.name}>{project.name}</p></td>
      <td className="px-3 py-5 align-top">{project.pm.first_name} {project.pm.last_name.charAt(0)}.</td>
      <td className="px-3 py-5 align-top">{project.pc ? `${project.pc.first_name} ${project.pc.last_name.charAt(0)}.` : <span className="text-text-secondary">—</span>}</td>
      <td className="px-3 py-5 align-top">
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${project.status === "ACTIVE" ? "bg-status-active-bg text-status-active-text" : "bg-status-closed-bg text-status-closed-text"}`}>
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${project.status === "ACTIVE" ? "bg-success" : "bg-neutral"}`} />{project.status === "ACTIVE" ? "ใช้งาน" : "ปิด"}
        </span>
      </td>
      <td className="px-3 py-5 align-top">
        {project.active_advance ? <div><p className="text-xs text-text-secondary">มีเงินทดรอง</p><p className="mt-1 font-medium tabular-nums">฿{Number(project.active_advance.amount).toLocaleString("th-TH")}</p></div> : <span className="text-xs text-text-secondary">ไม่มี</span>}
      </td>
      <td className="whitespace-nowrap px-3 py-5 align-top text-xs text-text-secondary">{formatThaiDate(project.created_at ?? project.start_date)}</td>
      <td className="py-3 pl-3 align-top">
        <div className="flex gap-1">
          <button type="button" disabled aria-label={`ดูโครงการ ${project.project_code} ยังไม่พร้อมใช้งาน`} title="ดูโครงการยังไม่พร้อมใช้งาน" className="icon-button disabled:cursor-not-allowed disabled:opacity-40"><LuEye size={18} aria-hidden /></button>
          {canEdit && <button type="button" disabled aria-label={`แก้ไขโครงการ ${project.project_code} ยังไม่พร้อมใช้งาน`} title="แก้ไขโครงการยังไม่พร้อมใช้งาน" className="icon-button disabled:cursor-not-allowed disabled:opacity-40"><LuPencil size={18} aria-hidden /></button>}
        </div>
      </td>
    </tr>
  );
}
