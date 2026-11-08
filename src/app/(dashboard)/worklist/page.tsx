"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LuFileText, LuFolderClosed, LuSearch, LuX } from "react-icons/lu";
import DropdownSelect from "@/components/ui/DropdownSelect";
import { WORKLIST_EXAMPLES, type WorklistExample, type WorklistStatus } from "./example-data";

const FILTERS: { label: string; status: WorklistStatus | "all" }[] = [
  { label: "ทั้งหมด", status: "all" },
  { label: "ต้องแก้ไข", status: "Returned for Revision" },
  { label: "รออนุมัติ", status: "Pending PM Approval" },
  { label: "Active", status: "Active" },
  { label: "ปิดแล้ว", status: "Closed" },
];

const STATUS_STYLES: Record<WorklistStatus, string> = {
  Draft: "bg-status-draft-bg text-status-draft-text",
  "Pending PM Approval": "bg-status-pending-bg text-status-pending-text",
  "Returned for Revision": "bg-status-return-bg text-status-return-text",
  Approved: "bg-status-approve-bg text-status-approve-text",
  Active: "bg-status-active-bg text-status-active-text",
  Closing: "bg-status-closing-bg text-status-closing-text",
  Closed: "bg-status-closed-bg text-status-closed-text",
};

const PROJECTS = Array.from(
  new Map(WORKLIST_EXAMPLES.map((item) => [item.projectCode, { code: item.projectCode, name: item.projectName }])).values()
);

type SortOrder = "latest" | "oldest" | "amount-desc" | "amount-asc";

function formatAmount(amount: number) {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
  });
}

function StatusBadge({ status }: { status: WorklistStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium leading-4 ${STATUS_STYLES[status]}`}>{status}</span>;
}

function PreviewDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_32px)] w-[calc(100%_-_32px)] max-w-lg overflow-y-auto rounded-lg border-0 bg-white p-0 text-text-primary shadow-menu backdrop:bg-black/40"
    >
      <div onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id={titleId} className="text-lg font-medium">{title}</h2>
          <button type="button" onClick={onClose} className="icon-button" aria-label="ปิดหน้าต่าง"><LuX size={18} aria-hidden /></button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export default function WorklistPage() {
  const [status, setStatus] = useState<WorklistStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [selected, setSelected] = useState<WorklistExample | null>(null);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return WORKLIST_EXAMPLES.filter((item) =>
      (status === "all" || item.status === status) &&
      (project === "all" || item.projectCode === project) &&
      (!search || `${item.code} ${item.projectCode} ${item.projectName}`.toLocaleLowerCase().includes(search))
    ).sort((a, b) => {
      if (sortOrder === "amount-desc") return b.amount - a.amount;
      if (sortOrder === "amount-asc") return a.amount - b.amount;
      return sortOrder === "latest" ? b.updatedAt.localeCompare(a.updatedAt) : a.updatedAt.localeCompare(b.updatedAt);
    });
  }, [status, query, project, sortOrder]);

  function resetFilters() {
    setStatus("all");
    setQuery("");
    setProject("all");
    setSortOrder("latest");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold leading-8">งานของฉัน</h1>
          <p className="mt-1.5 text-sm leading-5 text-text-secondary">คำขอเบิกเงินล่วงหน้าที่คุณสร้าง รวมทุกโปรเจค</p>
        </div>
        <button type="button" onClick={() => setProjectPickerOpen(true)} className="btn-primary min-h-11">เลือกโปรเจคเพื่อสร้างคำขอ</button>
      </div>

      <p id="worklist-preview-notice" className="rounded-sm bg-surface px-3 py-2 text-xs leading-4 text-text-secondary">ข้อมูลสมมติสำหรับการออกแบบ</p>

      <div role="group" aria-label="กรองสถานะคำขอ" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const count = filter.status === "all" ? WORKLIST_EXAMPLES.length : WORKLIST_EXAMPLES.filter((item) => item.status === filter.status).length;
          const active = status === filter.status;
          return (
            <button key={filter.status} type="button" aria-pressed={active} onClick={() => setStatus(filter.status)} className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-accent text-white" : "bg-surface text-text-primary hover:bg-border"}`}>
              {filter.label}<span className={`text-xs font-normal ${active ? "text-white/80" : "text-text-secondary"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_180px]">
        <div className="relative sm:col-span-2 xl:col-span-1">
          <LuSearch size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral" aria-hidden />
          <label htmlFor="worklist-search" className="sr-only">ค้นหาเลขที่หรือโปรเจค</label>
          <input id="worklist-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเลขที่ / โปรเจค" className="h-11 w-full rounded border border-border bg-white pl-11 pr-4 text-base placeholder:text-text-secondary focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:text-sm" />
        </div>
        <DropdownSelect
          id="worklist-project"
          label="โปรเจค"
          value={project}
          options={[
            { label: "ทุกโปรเจค", value: "all" },
            ...PROJECTS.map((item) => ({ label: item.name, value: item.code })),
          ]}
          onChange={setProject}
        />
        <DropdownSelect
          id="worklist-sort"
          label="เรียงลำดับ"
          value={sortOrder}
          options={[
            { label: "เรียงล่าสุด", value: "latest" },
            { label: "เรียงเก่าสุด", value: "oldest" },
            { label: "จำนวนเงินมากที่สุด", value: "amount-desc" },
            { label: "จำนวนเงินน้อยที่สุด", value: "amount-asc" },
          ]}
          onChange={(value) => setSortOrder(value as SortOrder)}
        />
      </div>

      <section aria-labelledby="advance-list-title" className="pt-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <h2 id="advance-list-title" className="text-sm font-medium">คำขอเบิกเงินล่วงหน้า</h2>
            <p role="status" aria-live="polite" aria-atomic="true" className="text-xs text-text-secondary">{filteredItems.length} รายการ</p>
          </div>
          <p className="text-xs text-text-secondary">จำนวนเงิน (บาท)</p>
        </div>
        <div role="region" aria-label="ตารางคำขอ เลื่อนแนวนอนเพื่อดูรายละเอียด" tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed text-sm" aria-describedby="worklist-preview-notice">
            <caption className="sr-only">ตัวอย่างคำขอเบิกเงินล่วงหน้า</caption>
            <thead className="bg-surface text-xs text-text-secondary">
              <tr className="h-10 text-left">
                <th scope="col" className="w-[14%] px-4 font-normal">เลขที่</th>
                <th scope="col" className="w-[28%] px-4 font-normal">โปรเจค</th>
                <th scope="col" className="w-[13%] px-4 text-right font-normal">จำนวนเงิน</th>
                <th scope="col" className="w-[17%] px-3 font-normal">สถานะ</th>
                <th scope="col" className="w-[20%] whitespace-nowrap px-4 font-normal">อัปเดตล่าสุด</th>
                <th scope="col" className="w-[8%] whitespace-nowrap px-4 text-right font-normal">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.code} className="h-[74px] border-b border-border transition-colors hover:bg-surface/50">
                  <td className="whitespace-nowrap px-4 py-4 font-medium">{item.code}</td>
                  <td className="px-4 py-4">
                    <p className="line-clamp-2 font-medium leading-5" title={item.projectName}>{item.projectName}</p>
                    <p className="mt-0.5 text-xs leading-4 text-text-secondary">{item.projectCode}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold tabular-nums">{formatAmount(item.amount)}</td>
                  <td className="px-3 py-4"><StatusBadge status={item.status} /></td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-text-secondary">{formatDate(item.updatedAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <button type="button" onClick={() => setSelected(item)} aria-label={`เปิดตัวอย่างคำขอ ${item.code}`} className="inline-flex min-h-9 min-w-9 items-center justify-end text-xs font-medium text-secondary underline-offset-4 hover:underline">เปิด</button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center">
                  <LuFileText size={28} className="mx-auto mb-3 text-neutral" aria-hidden />
                  <p className="font-medium">ไม่พบคำขอที่ตรงกับตัวกรอง</p>
                  <p className="mt-2 text-sm text-text-secondary">ลองเปลี่ยนคำค้นหา สถานะ หรือโปรเจค</p>
                  <button type="button" onClick={resetFilters} className="btn-secondary mt-4">ล้างตัวกรอง</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
          <p>แสดง {filteredItems.length === 0 ? "0" : `1–${filteredItems.length}`} จาก {filteredItems.length} รายการ</p>
          <p>ข้อมูลสมมติ</p>
        </div>
      </section>

      {selected && (
        <PreviewDialog title="ตัวอย่างรายละเอียดคำขอ" onClose={() => setSelected(null)}>
          <div className="space-y-5 p-6">
            <p className="rounded-sm bg-surface px-3 py-2 text-xs text-text-secondary">ข้อมูลสมมติสำหรับการออกแบบ</p>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-lg font-medium">{selected.code}</p><StatusBadge status={selected.status} /></div>
            <dl className="space-y-5">
              <div><dt className="text-xs text-text-secondary">โปรเจค</dt><dd className="mt-1 font-medium">{selected.projectName}</dd><dd className="mt-1 text-xs text-text-secondary">{selected.projectCode}</dd></div>
              <div><dt className="text-xs text-text-secondary">จำนวนเงิน (บาท)</dt><dd className="mt-1 text-2xl font-bold tabular-nums">{formatAmount(selected.amount)}</dd></div>
              <div><dt className="text-xs text-text-secondary">วัตถุประสงค์</dt><dd className="mt-1 leading-6">{selected.purpose}</dd></div>
              <div><dt className="text-xs text-text-secondary">อัปเดตล่าสุด</dt><dd className="mt-1">{formatDate(selected.updatedAt)}</dd></div>
            </dl>
          </div>
          <div className="flex justify-end border-t border-border px-6 py-4"><button type="button" onClick={() => setSelected(null)} className="btn-secondary">ปิด</button></div>
        </PreviewDialog>
      )}

      {projectPickerOpen && (
        <PreviewDialog title="เลือกโปรเจคเพื่อสร้างคำขอ" onClose={() => setProjectPickerOpen(false)}>
          <div className="space-y-4 p-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface text-neutral"><LuFolderClosed size={22} aria-hidden /></span>
            <p className="text-sm leading-6 text-text-secondary">เริ่มต้นจากรายการโครงการ เพื่อดูข้อมูลโครงการและผู้รับผิดชอบ</p>
            <p className="rounded-sm bg-surface px-3 py-2 text-xs leading-5 text-text-secondary">หน้านี้เป็นตัวอย่างสำหรับการออกแบบ การสร้างและแก้ไขคำขอยังไม่พร้อมใช้งาน</p>
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
            <button type="button" onClick={() => setProjectPickerOpen(false)} className="btn-secondary">ยกเลิก</button>
            <Link href="/project" onClick={() => setProjectPickerOpen(false)} className="btn-primary">ดูรายการโครงการ</Link>
          </div>
        </PreviewDialog>
      )}
    </div>
  );
}
