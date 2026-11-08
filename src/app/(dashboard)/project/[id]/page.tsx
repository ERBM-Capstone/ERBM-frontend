"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuCircleAlert, LuMinus, LuPencil, LuPlus, LuRotateCw, LuX } from "react-icons/lu";
import { useAuth } from "@/lib/auth/context";
import { fetchAllPages } from "@/lib/project/fetch-all-pages";
import type { Project } from "@/lib/project/types";

interface AdvanceListItem {
  id: number;
  advance_code: string;
  requester: { user_id: number; first_name: string; last_name: string };
  project: { id: number; project_code: string; name: string };
  purpose: string;
  amount: string;
  status: string;
  created_at: string;
}

interface ProjectInformation extends Project {
  department?: string | null;
}

const PENDING_STATUSES = new Set(["DRAFT", "PENDING_PM_APPROVAL", "RETURNED_FOR_REVISION", "APPROVED"]);

function getStatusLabel(status: string) {
  switch (status) {
    case "DRAFT": return "ฉบับร่าง";
    case "PENDING_PM_APPROVAL": return "รออนุมัติ";
    case "RETURNED_FOR_REVISION": return "ส่งกลับแก้ไข";
    case "APPROVED": return "อนุมัติแล้ว";
    case "ACTIVE": return "ใช้งาน";
    case "CLOSING": return "กำลังปิด";
    case "CLOSED": return "ปิด";
    default: return status;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `฿${amount.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`
    : `฿${value}`;
}

export default function ProjectInformationPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken, user } = useAuth();
  const [project, setProject] = useState<ProjectInformation | null>(null);
  const [advances, setAdvances] = useState<AdvanceListItem[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreateAdvanceOpen, setIsCreateAdvanceOpen] = useState(false);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    async function loadProjectInformation() {
      try {
        const token = await getToken();
        if (!active) return;
        if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

        const [projectResponse, projectAdvances] = await Promise.all([
          fetch(`/api/projects/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetchAllPages<AdvanceListItem>("/api/advances", new URLSearchParams({ project_id: id }), token, controller.signal),
        ]);
        const projectResult = await projectResponse.json().catch(() => {
          throw new Error("ระบบส่งข้อมูลโครงการกลับมาไม่ถูกต้อง");
        });
        if (!projectResponse.ok) throw new Error(projectResult.message ?? "โหลดข้อมูลโครงการไม่สำเร็จ");
        if (!projectResult.data?.id) throw new Error("ไม่พบข้อมูลโครงการ");

        if (active) {
          setProject(projectResult.data as ProjectInformation);
          setAdvances(projectAdvances);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(
            controller.signal.aborted
              ? "ใช้เวลาโหลดนานเกินไป กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง"
              : err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง",
          );
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setIsLoading(false);
      }
    }

    loadProjectInformation();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [getToken, id, reloadVersion]);

  const pendingAdvances = advances.filter((advance) => PENDING_STATUSES.has(advance.status));
  const advanceHistory = advances.filter((advance) => !PENDING_STATUSES.has(advance.status));
  const canEditProject = Boolean(project && (
    user?.role_code === "ADMIN" ||
    (user?.role_code === "PM" && project.pm.user_id === user.user_id) ||
    (user?.role_code === "PC" && project.pc?.user_id === user.user_id)
  ));
  const canCreateAdvance = Boolean(project && project.status === "ACTIVE" && user?.role_code === "PC" && project.pc?.user_id === user.user_id);

  return (
    <div className="space-y-8">
      <Link href="/project" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-lg font-semibold text-text-primary hover:text-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
        <LuArrowLeft size={22} aria-hidden />Project List
      </Link>

      {isLoading && !project ? (
        <div role="status" className="space-y-4" aria-label="กำลังโหลดข้อมูลโครงการ">
          <div className="h-8 w-64 animate-pulse rounded bg-surface" />
          <div className="h-36 animate-pulse rounded-xl bg-surface" />
          <div className="h-52 animate-pulse rounded-xl bg-surface" />
        </div>
      ) : error ? (
        <div role="alert" className="notice-error flex flex-wrap items-center gap-3">
          <LuCircleAlert size={20} className="shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 break-words">{error}</p>
          <button type="button" className="btn-secondary" onClick={() => { setError(null); setIsLoading(true); setReloadVersion((version) => version + 1); }}>
            <LuRotateCw size={16} aria-hidden />ลองอีกครั้ง
          </button>
        </div>
      ) : project ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-8">{project.name}</h1>
              <p className="mt-1 text-sm font-medium text-text-secondary">
                {project.project_code}<span className="mx-2" aria-hidden>·</span>
                <span className={project.status === "ACTIVE" ? "text-status-active-text" : "text-text-secondary"}>
                  {project.status === "ACTIVE" ? "ใช้งาน" : "ปิด"}
                </span>
              </p>
            </div>
            {canEditProject && <Link href={`/project/${id}/edit`} className="btn-secondary"><LuPencil size={16} aria-hidden />แก้ไขข้อมูลโครงการ</Link>}
          </header>

          <section aria-labelledby="project-information-title">
            <button
              type="button"
              aria-expanded={detailsOpen}
              aria-controls="project-information-panel"
              onClick={() => setDetailsOpen((open) => !open)}
              className="flex min-h-14 w-full items-center justify-between border-b border-border text-left transition-colors hover:text-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <span id="project-information-title" className="text-xl font-semibold">ข้อมูลโครงการ</span>
              {detailsOpen ? <LuMinus size={20} aria-hidden /> : <LuPlus size={20} aria-hidden />}
            </button>
            {detailsOpen && (
              <dl id="project-information-panel" className="grid gap-x-8 gap-y-6 py-6 sm:grid-cols-2 xl:grid-cols-3">
                <ProjectField label="รหัสโปรเจค" value={project.project_code} />
                <ProjectField label="ชื่อโปรเจค" value={project.name} />
                <ProjectField label="ผู้จัดการโปรเจค" value={`${project.pm.first_name} ${project.pm.last_name}`} />
                <ProjectField label="ผู้ประสานงาน" value={project.pc ? `${project.pc.first_name} ${project.pc.last_name}` : "—"} />
                <ProjectField label="แผนก" value={project.department?.trim() || "—"} />
                <ProjectField label="วันที่สร้าง" value={formatDate(project.created_at)} />
                {project.description && <ProjectField label="หมายเหตุ" value={project.description} />}
              </dl>
            )}
          </section>

          {successMessage && <div role="status" className="notice-success flex items-center gap-3"><span className="flex-1">{successMessage}</span><button type="button" className="icon-button" onClick={() => setSuccessMessage(null)} aria-label="ปิดข้อความ"><LuX size={16} aria-hidden /></button></div>}
          <AdvanceSection
            title="คำขอเงินทดรอง (Pending Request)"
            advances={pendingAdvances}
            action={canCreateAdvance ? <button type="button" className="btn-primary" onClick={() => setIsCreateAdvanceOpen(true)}><LuPlus size={17} aria-hidden />สร้างเงินทดรองจ่าย</button> : undefined}
          />
          <AdvanceSection title="ประวัติเงินทดรอง (Advance History)" advances={advanceHistory} />
          {isCreateAdvanceOpen && <CreateAdvanceDialog projectId={project.id} onClose={() => setIsCreateAdvanceOpen(false)} onCreated={() => { setIsCreateAdvanceOpen(false); setSuccessMessage("สร้างรายการเงินทดรองฉบับร่างแล้ว"); setReloadVersion((version) => version + 1); }} />}
        </>
      ) : null}
    </div>
  );
}

function ProjectField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-text-primary">{label}</dt>
      <dd className="mt-1 break-words text-sm text-text-secondary">{value}</dd>
    </div>
  );
}

function AdvanceSection({ title, advances, action }: { title: string; advances: AdvanceListItem[]; action?: React.ReactNode }) {
  return (
    <section className="space-y-4" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {action}
      </div>
      {advances.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-text-secondary">ไม่มีรายการเงินทดรอง</p>
      ) : (
        <div role="region" aria-label={`${title} เลื่อนแนวนอนเพื่อดูข้อมูลเพิ่มเติม`} tabIndex={0} className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">{title}</caption>
            <thead className="bg-surface text-left text-xs text-text-secondary">
              <tr>
                <th scope="col" className="px-4 py-4 font-medium">รหัสเงินทดรอง<br /><span className="font-normal">Advance Code</span></th>
                <th scope="col" className="px-4 py-4 font-medium">ผู้ขอ<br /><span className="font-normal">Advance Requester</span></th>
                <th scope="col" className="px-4 py-4 font-medium">จำนวนเงิน<br /><span className="font-normal">Amount</span></th>
                <th scope="col" className="px-4 py-4 font-medium">สถานะ<br /><span className="font-normal">Status</span></th>
                <th scope="col" className="px-4 py-4 font-medium">วันที่สร้าง<br /><span className="font-normal">Created Date</span></th>
              </tr>
            </thead>
            <tbody>
              {advances.map((advance) => <AdvanceRow key={advance.id} advance={advance} />)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CreateAdvanceDialog({ projectId, onClose, onCreated }: { projectId: number; onClose: () => void; onCreated: () => void }) {
  const { getToken } = useAuth();
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPurpose = purpose.trim();
    const trimmedAmount = amount.trim();
    if (!trimmedPurpose) return setError("กรุณาระบุวัตถุประสงค์");
    if (!/^\d{1,13}(\.\d{1,2})?$/.test(trimmedAmount) || Number(trimmedAmount) <= 0) {
      return setError("กรุณาระบุจำนวนเงินมากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const response = await fetch("/api/advances", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ project_id: projectId, purpose: trimmedPurpose, amount: trimmedAmount }),
      });
      const result = await response.json().catch(() => {
        throw new Error("ระบบส่งผลการสร้างกลับมาไม่ถูกต้อง");
      });
      if (!response.ok) throw new Error(result.message ?? "สร้างเงินทดรองไม่สำเร็จ");
      onCreated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "สร้างเงินทดรองไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="create-advance-title" className="my-auto w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-menu sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="create-advance-title" className="text-xl font-semibold">สร้างเงินทดรองจ่าย</h2>
            <p className="mt-1 text-sm text-text-secondary">ระบบจะสร้างรายการเป็นฉบับร่าง</p>
          </div>
          <button type="button" className="icon-button -mr-2 -mt-2" aria-label="ปิด" disabled={isSubmitting} onClick={onClose}><LuX size={18} aria-hidden /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="advance-purpose" className="text-sm font-medium">วัตถุประสงค์</label>
            <textarea id="advance-purpose" required maxLength={255} rows={3} value={purpose} onChange={(event) => setPurpose(event.target.value)} className="form-input resize-y rounded-lg border border-border bg-white" placeholder="ระบุวัตถุประสงค์การขอเงินทดรอง" />
          </div>
          <div className="space-y-2">
            <label htmlFor="advance-amount" className="text-sm font-medium">จำนวนเงิน (บาท)</label>
            <input id="advance-amount" required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="form-input rounded-lg border border-border bg-white" placeholder="เช่น 150000.00" />
          </div>
          {error && <div role="alert" className="notice-error rounded-lg">{error}</div>}
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
            <button type="button" className="btn-secondary" disabled={isSubmitting} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}><LuPlus size={16} aria-hidden />{isSubmitting ? "กำลังสร้าง…" : "สร้างฉบับร่าง"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdvanceRow({ advance }: { advance: AdvanceListItem }) {
  return (
    <tr className="border-t border-border transition-colors hover:bg-surface/50">
      <td className="whitespace-nowrap px-4 py-5 font-medium">{advance.advance_code}</td>
      <td className="px-4 py-5 text-text-secondary">{advance.requester.first_name} {advance.requester.last_name}</td>
      <td className="whitespace-nowrap px-4 py-5 font-medium tabular-nums">{formatAmount(advance.amount)}</td>
      <td className="px-4 py-5"><AdvanceStatus status={advance.status} /></td>
      <td className="whitespace-nowrap px-4 py-5 text-text-secondary">{formatDate(advance.created_at)}</td>
    </tr>
  );
}

function AdvanceStatus({ status }: { status: string }) {
  const style = status === "ACTIVE"
    ? "bg-status-active-bg text-status-active-text"
    : status === "PENDING_PM_APPROVAL" || status === "APPROVED"
      ? "bg-status-pending-bg text-status-pending-text"
      : status === "RETURNED_FOR_REVISION"
        ? "bg-status-return-bg text-status-return-text"
        : "bg-status-closed-bg text-status-closed-text";

  return <span className={`inline-flex min-w-24 justify-center rounded-full px-3 py-1 text-xs font-medium ${style}`}>{getStatusLabel(status)}</span>;
}
