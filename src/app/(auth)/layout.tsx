import Brand from "@/components/layout/Brand";
import { LuArrowDown, LuCheck } from "react-icons/lu";

const WORKFLOW = ["ขอเงินทดรองจ่าย", "ยืนยันการจ่ายเงิน", "บันทึกค่าใช้จ่าย", "กระทบยอดและปิดบัญชี"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background lg:p-6">
      <aside className="relative hidden w-[46%] max-w-[640px] shrink-0 flex-col justify-between rounded-xl bg-accent p-10 text-white lg:flex xl:p-12" aria-label="เกี่ยวกับ ERBM">
        <Brand inverted />
        <div className="my-16">
          <h2 className="max-w-sm text-[32px] font-bold leading-[1.5]">จัดการค่าใช้จ่ายโครงการ<br />ให้เป็นเรื่องเดียวกัน</h2>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">ตั้งแต่คำขอเงินทดรองจ่าย จนถึงการกระทบยอดและปิดบัญชี</p>
          <ol className="mt-10 max-w-sm">
            {WORKFLOW.map((step, index) => (
              <li key={step} className="flex items-center gap-4 border-b border-white/15 py-4 last:border-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 text-xs text-white/75" aria-hidden>{index === WORKFLOW.length - 1 ? <LuCheck size={14} /> : index + 1}</span>
                <span className="flex-1 text-sm font-medium">{step}</span>
                {index < WORKFLOW.length - 1 && <LuArrowDown size={14} className="text-white/40" aria-hidden />}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-white/60">Expense Reimbursement & Bill Management</p>
      </aside>

      <main id="main-content" className="flex min-w-0 flex-1 flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <div className="mb-16 lg:hidden"><Brand /></div>
        <div className="mx-auto flex w-full max-w-sm flex-1 items-center py-8 lg:py-16"><div className="w-full">{children}</div></div>
        <p className="mt-12 text-center text-xs text-text-secondary">ERBM · Sense Infotech</p>
      </main>
    </div>
  );
}
