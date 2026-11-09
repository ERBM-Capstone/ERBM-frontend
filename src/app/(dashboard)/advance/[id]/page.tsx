"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LuArrowLeft, LuCheck, LuCircleAlert, LuPencil, LuPrinter, LuRotateCw, LuSave, LuSend, LuX } from "react-icons/lu";
import { useAuth } from "@/lib/auth/context";

interface AdvanceDetail {
  id: number;
  advance_code: string;
  requester: { user_id: number; first_name: string; last_name: string };
  project: { id: number; project_code: string; name: string };
  purpose: string;
  amount: string;
  status: string;
  created_by: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AdvanceHistoryItem {
  id: number;
  action: "CREATE" | "UPDATE" | "SUBMIT" | "RETURN" | "APPROVE" | "DISBURSE";
  actor: { user_id: number; first_name: string; last_name: string };
  reason: string | null;
  revision: number | null;
  amount: string | null;
  purpose: string | null;
  occurred_at: string;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

function formatPrintDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("th-TH", { day: "numeric", month: "numeric", year: "numeric" });
}

function formatAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `฿${value}`;
}

function statusLabel(status: string) {
  switch (status) {
    case "DRAFT": return "ฉบับร่าง";
    case "PENDING_PM_APPROVAL": return "รอ PM อนุมัติ";
    case "RETURNED_FOR_REVISION": return "ส่งกลับแก้ไข";
    case "APPROVED": return "อนุมัติแล้ว";
    case "ACTIVE": return "ใช้งาน";
    case "CLOSED": return "ปิด";
    default: return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "DRAFT": return "bg-status-draft-bg text-status-draft-text";
    case "PENDING_PM_APPROVAL": return "bg-status-pending-bg text-status-pending-text";
    case "RETURNED_FOR_REVISION": return "bg-status-return-bg text-status-return-text";
    case "APPROVED": return "bg-status-approve-bg text-status-approve-text";
    case "ACTIVE": return "bg-status-active-bg text-status-active-text";
    case "CLOSED": return "bg-status-closed-bg text-status-closed-text";
    default: return "bg-surface text-text-primary";
  }
}

function historyActionLabel(action: AdvanceHistoryItem["action"]) {
  switch (action) {
    case "CREATE": return "สร้างคำขอ (Draft)";
    case "UPDATE": return "แก้ไขคำขอ";
    case "SUBMIT": return "ยื่นคำขอ (Pending PM Approval)";
    case "RETURN": return "ส่งกลับแก้ไข";
    case "APPROVE": return "อนุมัติคำขอ";
    case "DISBURSE": return "Accounting ยืนยันการจ่ายเงิน (Active)";
  }
}

export default function AdvanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken, user } = useAuth();
  const [advance, setAdvance] = useState<AdvanceDetail | null>(null);
  const [history, setHistory] = useState<AdvanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [isSavingAmount, setIsSavingAmount] = useState(false);
  const [amountValue, setAmountValue] = useState("");
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDisbursementConfirmOpen, setIsDisbursementConfirmOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAdvance = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const response = await fetch(`/api/advances/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => { throw new Error("ระบบส่งข้อมูลคำขอกลับมาไม่ถูกต้อง"); });
      if (!response.ok) throw new Error(result.message ?? "โหลดรายละเอียดคำขอไม่สำเร็จ");
      setAdvance(result.data as AdvanceDetail);
      setAmountValue((result.data as AdvanceDetail).amount);
      const historyResponse = await fetch(`/api/advances/${encodeURIComponent(id)}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyResult = await historyResponse.json().catch(() => null);
      if (historyResponse.ok && Array.isArray(historyResult?.data)) setHistory(historyResult.data as AdvanceHistoryItem[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดรายละเอียดคำขอไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAdvance(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAdvance]);

  async function submitAdvance() {
    if (!advance) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const response = await fetch(`/api/advances/${advance.id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => { throw new Error("ระบบส่งผลการส่งคำขอกลับมาไม่ถูกต้อง"); });
      if (!response.ok) throw new Error(result.message ?? "ส่งคำขอไม่สำเร็จ");
      setAdvance(result.data as AdvanceDetail);
      setNotice("ส่งคำขอให้ PM อนุมัติแล้ว");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveAmount() {
    if (!advance) return;
    const amount = amountValue.trim();
    if (!/^\d{1,13}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      setError("กรุณาระบุจำนวนเงินมากกว่า 0 และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
      return;
    }

    setIsSavingAmount(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const response = await fetch(`/api/advances/${advance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      const result = await response.json().catch(() => { throw new Error("ระบบส่งผลการบันทึกกลับมาไม่ถูกต้อง"); });
      if (!response.ok) throw new Error(result.message ?? "บันทึกจำนวนเงินไม่สำเร็จ");
      const updatedAdvance = result.data as AdvanceDetail;
      setAdvance(updatedAdvance);
      setAmountValue(updatedAdvance.amount);
      setIsEditingAmount(false);
      setNotice("บันทึกจำนวนเงินแล้ว");
      const historyResponse = await fetch(`/api/advances/${advance.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyResult = await historyResponse.json().catch(() => null);
      if (historyResponse.ok && Array.isArray(historyResult?.data)) setHistory(historyResult.data as AdvanceHistoryItem[]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกจำนวนเงินไม่สำเร็จ");
    } finally {
      setIsSavingAmount(false);
    }
  }

  async function reviewAdvance(action: "approve" | "return") {
    if (!advance) return;
    const reason = returnReason.trim();
    if (action === "return" && !reason) {
      setError("กรุณาระบุเหตุผลที่ส่งกลับไปแก้ไข");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const response = await fetch(`/api/advances/${advance.id}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(action === "return" ? { "Content-Type": "application/json" } : {}),
        },
        ...(action === "return" ? { body: JSON.stringify({ reason }) } : {}),
      });
      const result = await response.json().catch(() => { throw new Error("ระบบส่งผลการพิจารณากลับมาไม่ถูกต้อง"); });
      if (!response.ok) throw new Error(result.message ?? "ดำเนินการไม่สำเร็จ");
      setAdvance(result.data as AdvanceDetail);
      setNotice(action === "approve" ? "อนุมัติคำขอแล้ว" : "ส่งคำขอกลับไปแก้ไขแล้ว");
      setIsReturnOpen(false);
      setReturnReason("");
      const historyResponse = await fetch(`/api/advances/${advance.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyResult = await historyResponse.json().catch(() => null);
      if (historyResponse.ok && Array.isArray(historyResult?.data)) setHistory(historyResult.data as AdvanceHistoryItem[]);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDisbursement() {
    if (!advance) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      const response = await fetch(`/api/advances/${advance.id}/confirm-disbursement`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => { throw new Error("ระบบส่งผลการยืนยันจ่ายกลับมาไม่ถูกต้อง"); });
      if (!response.ok) throw new Error(result.message ?? "ยืนยันการจ่ายเงินไม่สำเร็จ");
      setAdvance(result.data as AdvanceDetail);
      setNotice("ยืนยันการจ่ายเงินแล้ว สถานะเปลี่ยนเป็นใช้งาน (ACTIVE)");
      setIsDisbursementConfirmOpen(false);
      const historyResponse = await fetch(`/api/advances/${advance.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const historyResult = await historyResponse.json().catch(() => null);
      if (historyResponse.ok && Array.isArray(historyResult?.data)) setHistory(historyResult.data as AdvanceHistoryItem[]);
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "ยืนยันการจ่ายเงินไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = Boolean(advance && advance.status === "DRAFT" && user?.role_code === "PC" && advance.created_by === user.user_id);
  const canReview = Boolean(advance && advance.status === "PENDING_PM_APPROVAL" && user?.role_code === "PM");
  const isApprovedPc = Boolean(advance && (advance.status === "APPROVED" || advance.status === "ACTIVE") && user?.role_code === "PC");
  const canConfirmDisbursement = Boolean(advance && advance.status === "APPROVED" && user?.role_code === "ACCOUNTING");
  const canEditAmount = Boolean(
    advance &&
    (advance.status === "DRAFT" || advance.status === "RETURNED_FOR_REVISION") &&
    user?.role_code === "PC" &&
    advance.created_by === user.user_id,
  );
  const submittedEvent = history.find((item) => item.action === "SUBMIT");
  const approvedEvent = history.find((item) => item.action === "APPROVE");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={advance ? `/project/${advance.project.id}` : "/project"} className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-lg font-semibold text-text-primary hover:text-neutral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
        <LuArrowLeft size={22} aria-hidden />กลับไปหน้าโปรเจกต์
      </Link>

      {isLoading ? <p role="status" className="py-12 text-center text-sm text-text-secondary">กำลังโหลดรายละเอียดคำขอ…</p> : error && !advance ? (
        <div role="alert" className="notice-error flex flex-wrap items-center gap-3">
          <LuCircleAlert size={20} aria-hidden /><span className="flex-1">{error}</span>
          <button type="button" className="btn-secondary" onClick={() => { setIsLoading(true); setError(null); void loadAdvance(); }}><LuRotateCw size={16} aria-hidden />ลองอีกครั้ง</button>
        </div>
      ) : advance && isApprovedPc ? (
        <>
          <article className="advance-print-page mx-auto max-w-5xl space-y-7 rounded-2xl border border-border bg-white p-6 sm:p-10">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-sm font-medium">{advance.project.name} · {advance.project.project_code}</p>
                <h1 className="mt-1 text-2xl font-bold">{advance.advance_code}</h1>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-medium ${statusClass(advance.status)}`}>{advance.status === "ACTIVE" ? "ใช้งาน" : "อนุมัติ"}</span>
            </header>

            <section aria-labelledby="approved-advance-information-title" className="space-y-4">
              <h2 id="approved-advance-information-title" className="border-b border-border pb-3 text-2xl font-semibold">ข้อมูลคำขอทดรองจ่าย</h2>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <DetailField label="ผู้ขอเบิก (PC)" value={`${advance.requester.first_name} ${advance.requester.last_name}`} />
                <DetailField label="ผู้จัดการโครงการ (PM)" value={approvedEvent ? `${approvedEvent.actor.first_name} ${approvedEvent.actor.last_name}` : "—"} />
                <DetailField label="วันที่ขอ" value={formatPrintDate(submittedEvent?.occurred_at ?? advance.created_at)} />
                <DetailField label="วันที่อนุมัติ" value={formatPrintDate(approvedEvent?.occurred_at)} />
                <DetailField label="จำนวนเงิน" value={formatAmount(advance.amount)} emphasized />
                <DetailField label="วัตถุประสงค์" value={advance.purpose} />
              </dl>
            </section>

            <section aria-labelledby="approved-advance-history-title" className="space-y-3">
              <h2 id="approved-advance-history-title" className="border-b border-border pb-3 text-2xl font-semibold">ประวัติการดำเนินการ</h2>
              <ol className="space-y-3">
                {history.map((item) => <li key={item.id} className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-text-primary">
                  <p className="font-medium">{historyActionLabel(item.action)}</p>
                  <p className="text-sm">{item.actor.first_name} {item.actor.last_name} · {formatPrintDate(item.occurred_at)}</p>
                  {item.reason && <p className="text-sm">เหตุผล: {item.reason}</p>}
                </li>)}
              </ol>
            </section>
          </article>

          <footer className="advance-no-print flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            <Link href={`/project/${advance.project.id}`} className="btn-secondary"><LuArrowLeft size={16} aria-hidden />ย้อนกลับ</Link>
            <button type="button" className="btn-primary" onClick={() => window.print()}><LuPrinter size={17} aria-hidden />พิมพ์เอกสาร</button>
          </footer>
        </>
      ) : advance && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-sm text-text-secondary">{canReview ? "อนุมัติคำขอทดรองจ่าย" : "รายละเอียดคำขอเงินทดรอง"}</p>
              <h1 className="mt-1 text-2xl font-bold">{advance.advance_code}</h1>
              <p className="mt-2 text-sm text-text-secondary">โครงการ <Link href={`/project/${advance.project.id}`} className="font-medium text-accent hover:underline">{advance.project.project_code} · {advance.project.name}</Link></p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${statusClass(advance.status)}`}>{statusLabel(advance.status)}</span>
          </header>

          {notice && <div role="status" className="notice-success">{notice}</div>}
          {error && <div role="alert" className="notice-error">{error}</div>}
          {canConfirmDisbursement && <p className="border-l-4 border-status-pending-text bg-status-pending-bg px-4 py-3 text-sm text-status-pending-text">ยืนยันเฉพาะรายการที่ได้จ่ายเงินจริงแล้ว การยืนยันจะเปลี่ยนสถานะเป็น ACTIVE</p>}
          {advance.status === "RETURNED_FOR_REVISION" && canEditAmount && (
            <div role="status" className="border-l-4 border-status-return-text bg-status-return-bg px-4 py-3 text-sm text-status-return-text">
              PM ส่งคำขอนี้กลับมาให้แก้ไข กรุณาตรวจเหตุผลในประวัติ แก้จำนวนเงินแล้วบันทึก จากนั้นส่งให้ PM พิจารณาอีกครั้ง
            </div>
          )}

          <section aria-labelledby="advance-information-title" className="space-y-4">
            <h2 id="advance-information-title" className="border-b border-border pb-3 text-xl font-semibold">ข้อมูลคำขอทดรองจ่าย</h2>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailField label="โปรเจค" value={`${advance.project.name} (${advance.project.project_code})`} />
              <DetailField label="ผู้ขอเบิก (PC)" value={`${advance.requester.first_name} ${advance.requester.last_name}`} />
              <div className="min-w-0">
                <dt className="text-sm text-text-secondary">จำนวนเงิน</dt>
                {isEditingAmount ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor="advance-edit-amount">จำนวนเงิน (บาท)</label>
                    <input id="advance-edit-amount" autoFocus inputMode="decimal" value={amountValue} onChange={(event) => setAmountValue(event.target.value)} className="form-input w-48 bg-white text-lg font-semibold tabular-nums" aria-describedby="advance-amount-hint" disabled={isSavingAmount} />
                    <span id="advance-amount-hint" className="text-xs text-text-secondary">บาท · ทศนิยมไม่เกิน 2 ตำแหน่ง</span>
                    <button type="button" className="btn-primary" onClick={() => void saveAmount()} disabled={isSavingAmount}><LuSave size={15} aria-hidden />{isSavingAmount ? "กำลังบันทึก…" : "บันทึก"}</button>
                    <button type="button" className="btn-secondary" onClick={() => { setAmountValue(advance.amount); setIsEditingAmount(false); setError(null); }} disabled={isSavingAmount}>ยกเลิก</button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <dd className="text-2xl font-bold tabular-nums">{formatAmount(advance.amount)}</dd>
                    {canEditAmount && <button type="button" className="btn-secondary" onClick={() => { setAmountValue(advance.amount); setIsEditingAmount(true); setError(null); }}><LuPencil size={14} aria-hidden />แก้ไขจำนวนเงิน</button>}
                  </div>
                )}
              </div>
              <DetailField label="วันที่ขอ" value={formatDate(advance.created_at)} />
            </dl>
          </section>

          <section aria-labelledby="advance-history-title" className="space-y-3">
            <h2 id="advance-history-title" className="border-b border-border pb-3 text-xl font-semibold">ประวัติการดำเนินการ</h2>
            {history.length === 0 ? <p className="text-sm text-text-secondary">ไม่มีประวัติการดำเนินการ</p> : (
              <ol className="space-y-4">
                {history.map((item) => <li key={item.id} className="border-l-2 border-border pl-4">
                  <p className="font-medium">{historyActionLabel(item.action)}</p>
                  <p className="text-xs text-text-secondary">{item.actor.first_name} {item.actor.last_name} · {formatDate(item.occurred_at)}</p>
                  {item.reason && <p className="mt-1 text-sm text-text-secondary">เหตุผล: {item.reason}</p>}
                  {item.action === "SUBMIT" && item.amount && <p className="mt-1 text-xs text-text-secondary">ยอดที่ส่ง: {formatAmount(item.amount)}{item.revision ? ` · รอบที่ ${item.revision}` : ""}</p>}
                </li>)}
              </ol>
            )}
          </section>

          {isReturnOpen && <form onSubmit={(event) => { event.preventDefault(); void reviewAdvance("return"); }} className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <label htmlFor="advance-return-reason" className="block text-sm font-medium">เหตุผลที่ส่งกลับไปแก้ไข <span className="text-danger-text" aria-hidden>*</span></label>
            <textarea id="advance-return-reason" required autoFocus rows={3} value={returnReason} onChange={(event) => setReturnReason(event.target.value)} className="form-input resize-y bg-white" placeholder="ระบุรายละเอียดที่ต้องการให้แก้ไข" disabled={isSubmitting} />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setIsReturnOpen(false)} disabled={isSubmitting}>ยกเลิก</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "กำลังส่งกลับ…" : "ยืนยันส่งกลับแก้ไข"}</button>
            </div>
          </form>}

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
            <Link href={`/project/${advance.project.id}`} className="btn-secondary"><LuArrowLeft size={16} aria-hidden />ย้อนกลับ</Link>
            <div className="flex flex-wrap justify-end gap-3">
              {canSubmit && <button type="button" className="btn-primary" onClick={() => void submitAdvance()} disabled={isSubmitting || isEditingAmount || isSavingAmount}><LuSend size={16} aria-hidden />{isSubmitting ? "กำลังส่ง…" : "ส่งให้ PM อนุมัติ"}</button>}
              {canReview && <>
                <button type="button" className="btn-secondary" onClick={() => { setIsReturnOpen(true); setError(null); }} disabled={isSubmitting}><LuX size={16} aria-hidden />ส่งกลับแก้ไข</button>
                <button type="button" className="btn-primary" onClick={() => void reviewAdvance("approve")} disabled={isSubmitting}><LuCheck size={16} aria-hidden />{isSubmitting ? "กำลังอนุมัติ…" : "อนุมัติ"}</button>
              </>}
              {canConfirmDisbursement && <button type="button" className="btn-primary" onClick={() => setIsDisbursementConfirmOpen(true)} disabled={isSubmitting}><LuCheck size={16} aria-hidden />ยืนยันการจ่ายเงิน</button>}
            </div>
          </footer>

          {isDisbursementConfirmOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSubmitting) setIsDisbursementConfirmOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="confirm-disbursement-title" className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-white p-6 shadow-menu">
              <h2 id="confirm-disbursement-title" className="text-lg font-semibold">ยืนยันการจ่ายเงินทดรอง</h2>
              <p className="text-sm leading-6 text-text-secondary">ยืนยันว่าได้จ่ายเงินจริงสำหรับ {advance.advance_code} จำนวน {formatAmount(advance.amount)} แล้วหรือไม่? เมื่อยืนยันแล้ว Advance จะเปลี่ยนเป็นสถานะ ACTIVE</p>
              {error && <p role="alert" className="notice-error">{error}</p>}
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className="btn-secondary" onClick={() => setIsDisbursementConfirmOpen(false)} disabled={isSubmitting}>ยกเลิก</button>
                <button type="button" className="btn-primary" onClick={() => void confirmDisbursement()} disabled={isSubmitting}>{isSubmitting ? "กำลังยืนยัน…" : "ยืนยันว่าจ่ายแล้ว"}</button>
              </div>
            </section>
          </div>}
        </>
      )}
    </div>
  );
}

function DetailField({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return <div className="min-w-0"><dt className="text-sm text-text-secondary">{label}</dt><dd className={`mt-1 break-words ${emphasized ? "text-2xl font-bold tabular-nums" : "font-medium"}`}>{value}</dd></div>;
}
