/** Design fixtures from the supplied Figma reference, never live advance records. */
export type WorklistStatus =
  | "Draft"
  | "Pending PM Approval"
  | "Returned for Revision"
  | "Approved"
  | "Active"
  | "Closing"
  | "Closed";

export interface WorklistExample {
  code: string;
  projectCode: string;
  projectName: string;
  amount: number;
  status: WorklistStatus;
  updatedAt: string;
  purpose: string;
}

export const WORKLIST_EXAMPLES: WorklistExample[] = [
  {
    code: "ADV-2026-013",
    projectCode: "PRJ-2026-005",
    projectName: "ปรับปรุงหน้าบ้านลูกค้า",
    amount: 18500,
    status: "Returned for Revision",
    updatedAt: "2026-11-04",
    purpose: "ค่าใช้จ่ายสำหรับดำเนินงานปรับปรุงหน้าบ้านลูกค้า",
  },
  {
    code: "ADV-2026-015",
    projectCode: "PRJ-2026-006",
    projectName: "ระบบบริหารธุรการ",
    amount: 22000,
    status: "Draft",
    updatedAt: "2026-11-03",
    purpose: "ค่าใช้จ่ายสำหรับจัดเตรียมและทดสอบระบบบริหารธุรการ",
  },
  {
    code: "ADV-2026-009",
    projectCode: "PRJ-2026-004",
    projectName: "ระบบ CRM ฝ่ายขาย",
    amount: 80000,
    status: "Active",
    updatedAt: "2026-11-02",
    purpose: "ค่าใช้จ่ายในการติดตั้งและอบรมการใช้งานระบบ CRM",
  },
  {
    code: "ADV-2026-014",
    projectCode: "PRJ-2026-007",
    projectName: "ระบบจัดการคลังสินค้า v2",
    amount: 50000,
    status: "Approved",
    updatedAt: "2026-10-30",
    purpose: "ค่าใช้จ่ายในการเตรียมความพร้อมระบบจัดการคลังสินค้า",
  },
  {
    code: "ADV-2026-012",
    projectCode: "PRJ-2026-002",
    projectName: "ย้ายระบบขึ้น Cloud",
    amount: 120000,
    status: "Pending PM Approval",
    updatedAt: "2026-10-29",
    purpose: "ค่าใช้จ่ายในการย้ายระบบและตรวจสอบบริการ Cloud",
  },
  {
    code: "ADV-2026-006",
    projectCode: "PRJ-2026-001",
    projectName: "ระบบจัดการเอกสาร",
    amount: 35000,
    status: "Closing",
    updatedAt: "2026-10-28",
    purpose: "ค่าใช้จ่ายในการดำเนินงานระบบจัดการเอกสาร",
  },
  {
    code: "ADV-2026-002",
    projectCode: "PRJ-2026-004",
    projectName: "ระบบ CRM ฝ่ายขาย",
    amount: 65000,
    status: "Closed",
    updatedAt: "2026-10-27",
    purpose: "ค่าใช้จ่ายในการเตรียมข้อมูลสำหรับระบบ CRM",
  },
];
