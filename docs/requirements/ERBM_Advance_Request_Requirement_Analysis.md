# ERBM — Advance Request Flow Requirement Analysis

## 1. Overview

เอกสารนี้ใช้สำหรับวิเคราะห์ requirement ของระบบ **Expense Reimbursement and Bill Management System (ERBM)** โดยเน้น flow หลักของ **Advance Request → Disbursement → Expense Recording → Closing / Reconciliation** และตรวจสอบว่าข้อมูลที่มีอยู่เพียงพอต่อการออกแบบ **Database, API, Wireframe, Permission, และ Business Rules** หรือยัง

---

## 2. Current Advance Request Flow

### 2.1 Advance Request

1. **Create Advance Request**  
   PC สร้าง Advance Request ผูกกับ Project ที่ได้รับมอบหมาย เริ่มต้น status = `Draft`

2. **Enter Request Information**  
   PC กรอก Advance Amount, Business Purpose, และข้อมูลโปรเจคที่จำเป็น

3. **Submit Request to PM**  
   PC ยื่นคำขอ, status เปลี่ยนจาก `Draft` → `Pending PM Approval`

4. **Review by PM**  
   PM ที่รับผิดชอบรีวิว Advance Request

5. **Return the Request for Revision if Required**  
   ถ้าต้องแก้ไข PM เลือก Return for Revision และต้องใส่ reason, status → `Returned for Revision`

6. **Display the Returned Request to the Project Coordinator**  
   คำขอที่ถูกตีกลับแสดงใน worklist ของ PC, filter ได้ตาม status, ระบบแสดง return reason

7. **Revise the Returned Request**  
   เมื่อ PC แก้ไขและ save คำขอที่ถูกตีกลับ status เปลี่ยนจาก `Returned for Revision` → `Draft`  
   หมายเหตุ: แค่เปิดดูไม่เปลี่ยน status

8. **Resubmit the Request**  
   หลังแก้ไขเสร็จ PC ยื่น Draft อีกครั้ง, status → `Pending PM Approval`

9. **Retain the Revision History**  
   ระบบเก็บ submission เดิม, return reason, การเปลี่ยนแปลง, และ resubmission history

10. **Approve the Advance Request**  
    ถ้าคำขอผ่าน PM อนุมัติ, status → `Approved`

11. **Generate the Advance Request Document**  
    หลัง PM อนุมัติ PC generate และ print เอกสาร Advance Request

12. **Obtain MD Signature Outside the System**  
    นำเอกสารที่พิมพ์ไปให้ MD เซ็นบนกระดาษ  
    หมายเหตุ: MD ไม่อนุมัติหรือเซ็นในระบบใน phase 1

---

### 2.2 Disbursement

13. **Submit the Signed Document to Accounting**  
    เอกสารกระดาษที่เซ็นแล้วส่งต่อไปยัง Accounting ผ่าน business process เดิม

14. **Disburse the Advance Funds**  
    Accounting ดำเนินการจ่ายเงินจริงตาม financial process เดิม

15. **Confirm Disbursement**  
    หลังจ่ายเงินแล้ว Accounting เลือก Confirm Disbursement  
    หมายเหตุ: เป็นแค่การยืนยันการจ่ายจริง ไม่ใช่ business approval อีกขั้น

16. **Check for an Existing Active Advance**  
    ก่อน activate Advance ระบบเช็คว่า Project เดียวกันมี Advance สถานะ `Active` อยู่แล้วหรือไม่

17. **Prevent Multiple Active Advances**  
    ถ้ามี Advance อื่น `Active` อยู่แล้วในโปรเจคเดียวกัน ระบบห้าม Advance ใหม่เป็น `Active`

18. **Activate the Advance**  
    ถ้าโปรเจคไม่มี Advance Active อื่น ระบบเปลี่ยน status จาก `Approved` → `Active` และบันทึก disbursement details + action history

---

### 2.3 Expense Recording

19. **Record an Expense**  
    ระหว่าง Advance เป็น `Active`, PC สร้าง Expense transaction

20. **Enter the Business Purpose**  
    PC กรอก Business Purpose ของ Expense เช่น `UAT refreshments`

21. **Upload Supporting Evidence**  
    PC upload Receipt/Supporting Document 1 ไฟล์ต่อ Expense  
    ระบบเก็บ PDF/รูปต้นฉบับ + metadata

22. **Extract Receipt Data with OCR**  
    ระบบใช้ OCR ดึงข้อมูล header และ line items  
    field อาจว่างได้ถ้าดึงไม่ได้หรือไม่แน่ใจ

23. **Review the OCR Result**  
    PC เทียบข้อมูลที่ OCR ดึงมากับเอกสารต้นฉบับ และแก้ไขค่าที่ผิด

24. **Confirm the Expense Amount**  
    PC confirm ยอด Expense ที่จะหักจาก Advance Budget  
    ระบบใช้ยอดที่ user confirm ไม่ใช้ OCR grand total อัตโนมัติ

25. **Retain Receipt Line Items as Evidence**  
    line items จาก OCR เก็บไว้เพื่อ review/audit เท่านั้น  
    ไม่ใช่ transaction แยก และไม่หัก budget เอง

26. **Record Additional Expenses**  
    PC ทำซ้ำขั้นตอนบันทึก expense สำหรับ Receipt/Supporting Document เพิ่มเติมระหว่าง Advance ยัง `Active`

---

### 2.4 Closing / Reconciliation

27. **Initiate Closing**  
    เมื่อ PC พร้อม reconcile Advance, PC เริ่ม closing process

28. **Review the Reconciliation**  
    PC รีวิว Advance Amount, Total Confirmed Expenses, Return Amount ตาม rule ข้อ 29

29. **Rule**  

    ```text
    Advance Amount = Total Confirmed Expenses + Return Amount
    ```

30. **Submit the Closing Request**  
    หลัง reconcile เสร็จ PC ยื่น Closing Request, status Advance → `Closing`

31. **Review Closing by Accounting**  
    Accounting รีวิว reconciliation, confirmed expenses, เอกสารที่ upload, และ action history

32. **Return Closing for Correction if Required**  
    ถ้าข้อมูล closing ต้องแก้ไข Accounting ตีกลับให้ PC พร้อม reason บังคับ  
    ระบบเก็บ return/correction history

33. **Correct and Resubmit Closing**  
    PC แก้ไข expense/เอกสาร/Return Amount/ข้อมูล closing และยื่น Closing Request ใหม่ให้ Accounting

34. **Confirm Final Closing**  
    ถ้า reconciliation และหลักฐานถูกต้อง Accounting confirm closing, status Advance → `Closed`

35. **Apply the Year-End Rule**  
    Advance ที่ยัง `Active` ต้องปิดก่อนข้ามรอบปีงบประมาณ

36. **Open Another Advance for the Project**  
    1 Project มีได้หลาย Advance Budget ตลอดอายุโปรเจค  
    เปิด Advance ใหม่ได้ทุกเมื่อที่ไม่มี Advance `Active` อยู่  
    หมายเหตุ: ไม่ต้องรอข้ามปี

---

## 3. Create Project Field Analysis

### 3.1 Current Proposed Fields

| # | Field | Input Type | Required | Note |
|---|---|---|---|---|
| 1 | Project Code | Text / Auto-generate | Yes | Unique, ใช้อ้างอิงทุกที่ |
| 2 | Project Name | Text | Yes | แสดงใน worklist/เอกสาร |
| 3 | Responsible PM | Dropdown from users where role = PM | Yes | ผูกกับ approval flow |
| 4 | Project Coordinator | Dropdown from users where role = PC | Yes | คนที่มีสิทธิ์สร้าง Advance ให้โปรเจคนี้ |
| 5 | Status | Toggle / Dropdown | Yes | `Active` / `Inactive`, default = `Active` |
| 6 | Fiscal Year / Period | Dropdown / Date Range | Recommended | เกี่ยวกับ year-end rule |
| 7 | Department / Division | Dropdown | Optional | ถ้ามี reporting แยกฝ่าย |
| 8 | Client / Customer | Text / Dropdown | Optional | ถ้าผูกกับลูกค้าภายนอก |
| 9 | Description / Note | Textarea | Optional | รายละเอียดเพิ่มเติม |

---

### 3.2 Minimal Required Fields

| Field | Required | Reason |
|---|---:|---|
| Project Code | Yes | ใช้อ้างอิง project ในทุก flow |
| Project Name | Yes | ใช้แสดงใน worklist และเอกสาร |
| Responsible PM | Yes | ใช้ route approval ไปยัง PM ที่รับผิดชอบ |
| Project Coordinator | Yes | ใช้กำหนดสิทธิ์ PC ที่สร้าง Advance ได้ |
| Status | Yes | ใช้กำหนดว่า project ยังใช้งานได้หรือไม่ |

---

### 3.3 Recommended Additional Fields

| Field | Recommendation | Reason |
|---|---|---|
| Fiscal Year / Period | ควรบังคับถ้าต้อง enforce year-end rule | ใช้ตรวจว่า Advance ต้องปิดก่อนรอบปีงบประมาณใด |
| Project Start Date | แนะนำ | ใช้ระบุช่วงเวลาของ project |
| Project End Date | แนะนำ | ใช้ validate project lifecycle |
| Department / Division | แนะนำ | ใช้ reporting และ worklist |
| Project Budget | ควรถามลูกค้าเพิ่ม | ถ้ามี budget limit ต้องใช้ validate Advance Amount |
| Client / Customer | Optional | ใช้กรณี project ผูกกับลูกค้าภายนอก |
| Description / Note | Optional | ใช้เก็บรายละเอียดเพิ่มเติม |

---

## 4. What Is Already Clear

| Topic | Current Understanding |
|---|---|
| Advance creator | PC |
| Advance belongs to | Project |
| First approval | PM |
| PM return reason | Required |
| MD system approval | Not in phase 1 |
| MD signature | Outside system, paper-based |
| Accounting role before Active | Confirm actual disbursement only |
| Multiple Active Advance | Not allowed in the same Project |
| Expense evidence | 1 receipt/supporting document per Expense |
| OCR | Used for extraction, but not automatically trusted for amount |
| Budget deduction | Based on PC-confirmed amount |
| Receipt line items | Evidence/audit only, not transaction items |
| Closing rule | Advance Amount = Total Confirmed Expenses + Return Amount |
| New Advance in same Project | Allowed when there is no Active Advance |

---

## 5. Missing / Unclear Information

## 5.1 Role & Permission

Current known roles:

| Role | Current Responsibility |
|---|---|
| PC | Create Advance, revise, resubmit, record expense, initiate closing |
| PM | Review, approve, return Advance Request |
| Accounting | Confirm disbursement, review closing, return closing, confirm closed |
| MD | Sign paper document outside system |

Questions to clarify:

1. PC เห็นเฉพาะ Project ที่ตัวเอง assigned หรือเห็นทั้งหมด?
2. PM เห็นเฉพาะ Project ที่ตัวเองรับผิดชอบหรือไม่?
3. Accounting เห็นทุก Project หรือเฉพาะบาง Department?
4. ต้องมี Admin สำหรับจัดการ User, Role, Project หรือไม่?
5. PM สามารถแก้ไข amount เองได้ไหม หรือทำได้แค่ approve/return?
6. Accounting สามารถแก้ Expense ได้ไหม หรือ return ให้ PC แก้เท่านั้น?
7. ใครสามารถ cancel/delete Draft ได้?
8. ถ้า PM/PC เปลี่ยนคน ต้อง transfer project owner ได้ไหม?

Recommended roles:

| Role | Recommendation |
|---|---|
| Admin | ควรมี |
| PC | ต้องมี |
| PM | ต้องมี |
| Accounting | ต้องมี |
| MD | ไม่จำเป็นต้อง login ใน phase 1 |

---

## 5.2 Status Lifecycle

Current status from requirement:

| Status | Meaning |
|---|---|
| Draft | PC กำลังกรอกหรือแก้ไข |
| Pending PM Approval | รอ PM review |
| Returned for Revision | PM ตีกลับให้แก้ |
| Approved | PM อนุมัติแล้ว แต่ยังไม่ Active |
| Active | Accounting confirm disbursement แล้ว |
| Closing | PC ส่ง closing request แล้ว |
| Closed | Accounting confirm final closing แล้ว |

Recommended status enum:

```text
DRAFT
PENDING_PM_APPROVAL
RETURNED_FOR_REVISION
APPROVED
ACTIVE
PENDING_CLOSING_REVIEW
CLOSING_RETURNED
CLOSED
CANCELLED
REJECTED
```

Questions to clarify:

1. ต้องมี `Cancelled` ไหม?
2. ต้องมี `Rejected` ไหม หรือมีแค่ Return?
3. ระหว่าง `Approved` กับ `Active` ต้องมี status เช่น `Waiting for Disbursement` หรือไม่?
4. ถ้า Accounting return closing ควรใช้ status อะไร?
5. ถ้า confirm disbursement ไม่สำเร็จเพราะมี Active อยู่แล้ว status จะค้างที่อะไร?
6. Year-end rule จะ block status ไหนบ้าง?

---

## 5.3 Advance Request Validation

Known required fields:

- Advance Amount
- Business Purpose
- Project

Questions to clarify:

| Field / Rule | Question |
|---|---|
| Advance Amount | มีขั้นต่ำ/สูงสุดไหม? |
| Currency | ใช้ THB เท่านั้นหรือรองรับหลายสกุลเงิน? |
| Decimal | รองรับทศนิยมไหม? |
| Business Purpose | ต้องมีความยาวขั้นต่ำ/สูงสุดเท่าไหร่? |
| Project | เลือกได้เฉพาะ Active Project ไหม? |
| Attachment | ตอนขอ Advance ต้องแนบเอกสารประกอบไหม? |
| Expected Use Date | ต้องระบุวันที่จะใช้เงินไหม? |
| Expected Clearing Date | ต้องระบุวันที่คาดว่าจะ close ไหม? |
| Bank Account | ต้องเก็บบัญชีรับเงินของ PC ไหม? |
| Tax / VAT / WHT | เกี่ยวข้องกับ Advance หรือ Expense ไหม? |

Recommended database type for amount:

```sql
DECIMAL(12, 2)
```

ไม่ควรใช้ `FLOAT` เพราะเป็นข้อมูลการเงิน

---

## 5.4 Document Generation

Known:

- PC generate document after PM approval
- PC print document
- MD signs outside the system

Questions to clarify:

1. เอกสารเป็น PDF ใช่ไหม?
2. Template เอกสารหน้าตาเป็นอย่างไร?
3. เลขที่เอกสาร generate อย่างไร?
4. Generate ได้กี่ครั้ง?
5. ต้องเก็บ document version ไหม?
6. หลังแก้ไขข้อมูลแล้ว generate ใหม่ได้ไหม?
7. ต้องมี QR code/barcode ไหม?
8. ต้องแสดงชื่อ PM และเวลาอนุมัติในเอกสารไหม?
9. หลัง MD เซ็นกระดาษแล้ว ต้อง upload signed document กลับเข้าระบบไหม?

Important clarification:

```text
หลัง MD เซ็นเอกสารกระดาษแล้ว ต้อง upload signed document กลับเข้าระบบหรือไม่?
```

ถ้าต้องการ audit ครบ ควรรองรับการ upload signed document กลับเข้าระบบ

---

## 5.5 Disbursement Details

Known:

- Accounting confirm disbursement หลังจ่ายเงินจริงแล้ว
- ไม่ใช่ business approval อีกขั้น
- หลัง confirm สำเร็จ status เปลี่ยนจาก `Approved` → `Active`

Questions to clarify:

| Field | Question |
|---|---|
| Disbursement Date | ต้องกรอกวันที่จ่ายจริงไหม? |
| Disbursed Amount | ต้องเท่ากับ Advance Amount ไหม? |
| Payment Method | ต้องเลือกวิธีจ่ายไหม เช่น transfer, cash, cheque? |
| Transaction Reference No. | ต้องเก็บเลขอ้างอิงการโอนไหม? |
| Proof of Payment | ต้องแนบสลิปหรือหลักฐานจ่ายไหม? |
| Accounting Note | ต้องมีหมายเหตุไหม? |
| Confirmed By / At | ต้องเก็บผู้ยืนยันและเวลาไหม? |

Recommended rule:

```text
Disbursed Amount must equal Approved Advance Amount.
```

ถ้ายอดไม่เท่ากัน ควร return/cancel/request ใหม่ แทนที่จะ activate ด้วยยอดไม่ตรง

---

## 5.6 Active Advance Rule

Known:

```text
1 Project ห้ามมี Advance status Active มากกว่า 1 รายการ
```

Questions to clarify:

1. ถ้ามี Advance status `Closing` อยู่ เปิด Advance ใหม่ได้ไหม?
2. ถ้ามี Advance status `Approved` แต่ยังไม่ Active เปิดอีกอันได้ไหม?
3. ถ้ามี Advance status `Draft` หรือ `Returned for Revision` เปิดใหม่ได้ไหม?
4. Active rule นับเฉพาะ `Active` หรือรวม `Approved`, `Closing`, `Closing Returned` ด้วย?

Safer recommended rule:

```text
หนึ่ง Project ควรมีได้แค่ 1 Advance ที่ยังไม่จบในกลุ่ม status ต่อไปนี้:
APPROVED, ACTIVE, PENDING_CLOSING_REVIEW, CLOSING_RETURNED

ถ้ายังไม่ CLOSED / CANCELLED / REJECTED ไม่ควรเปิด Advance ใหม่
```

แต่ requirement ปัจจุบันเขียนว่า “ไม่มี Advance Active อยู่” ดังนั้นควรถามลูกค้าให้ชัดก่อน

---

## 5.7 Expense Validation

Known:

- Expense สร้างได้ตอน Advance เป็น `Active`
- 1 Expense มี 1 Receipt/Supporting Document
- OCR ดึงข้อมูลได้ แต่ยอดที่หัก budget ต้องใช้ยอดที่ PC confirm
- Line items ใช้เป็น evidence/audit เท่านั้น

Questions to clarify:

| Topic | Question |
|---|---|
| Remaining Amount | Expense amount เกิน remaining advance ได้ไหม? |
| Expense Date | ต้องอยู่ในช่วง project/fiscal year ไหม? |
| Category | Expense ต้องมี category ไหม? |
| Vendor | ต้องมี vendor/merchant ไหม? |
| Edit Permission | Expense แก้ไขได้ถึงตอนไหน? |
| Delete Permission | Expense ลบได้ไหม หรือ soft delete เท่านั้น? |
| Receipt Reuse | Receipt 1 ใบใช้กับหลาย Expense ได้ไหม? |
| No Receipt Case | ถ้าไม่มีใบเสร็จ สามารถใช้ supporting document ได้ไหม? |
| Tax | ต้องเก็บ VAT/WHT ไหม? |
| Expense Status | ต้องมี Draft/Confirmed/Submitted/Rejected ไหม? |

Recommended minimum Expense fields:

```text
expense_id
advance_id
business_purpose
expense_date
confirmed_amount
receipt_file_id
ocr_status
created_by
created_at
updated_at
```

Recommended additional fields:

```text
vendor_name
receipt_no
receipt_date
category
note
is_deleted
```

---

## 5.8 OCR

Questions to clarify:

1. ใช้ OCR provider อะไร?
2. OCR ทำทันทีหรือทำผ่าน background job?
3. OCR fail แล้วให้ PC กรอกเองได้ไหม?
4. ต้องเก็บ confidence score ไหม?
5. รองรับภาษาไทยไหม?
6. รองรับไฟล์ประเภทอะไร เช่น PDF, JPG, PNG?
7. จำกัดขนาดไฟล์เท่าไหร่?
8. Line items ต้องแก้ไขได้ไหม?
9. ต้องเก็บ original OCR result และ user-corrected result แยกกันไหม?

Recommended data separation:

```text
ocr_raw_result = ข้อมูลดิบที่ OCR อ่านได้
user_confirmed_amount = ยอดที่ user ยืนยันใช้จริง
```

ไม่ควร overwrite OCR raw result เพราะใช้สำหรับ audit ได้

---

## 5.9 Closing / Reconciliation

Known rule:

```text
Advance Amount = Total Confirmed Expenses + Return Amount
```

Recommended formula:

```text
Return Amount = Advance Amount - Total Confirmed Expenses
Return Amount must be >= 0
Advance Amount must equal Total Confirmed Expenses + Return Amount
```

Questions to clarify:

1. Return Amount ต้องจ่ายคืนจริงก่อน Accounting close ไหม?
2. ต้องแนบ proof of return money ไหม?
3. Return Amount เป็น 0 ได้ไหม?
4. Expense เกิน Advance Amount ได้ไหม?
5. ถ้า Expense เกิน Advance Amount ต้องทำ reimbursement เพิ่มหรือ block?
6. Accounting สามารถแก้ยอด closing ได้ไหม หรือ return ให้ PC แก้เท่านั้น?
7. Closing มี document generation ไหม?
8. มี deadline closing ไหม นอกจาก year-end rule?
9. Closing return reason เก็บเหมือน PM return reason ไหม?

Important edge case:

```text
Advance Amount = 10,000
Total Confirmed Expenses = 11,000
Return Amount = -1,000
```

ต้องถามลูกค้าว่า case นี้ระบบควร block หรือให้สร้าง reimbursement เพิ่ม

---

## 5.10 Year-End Rule

Known:

```text
Advance ที่ยัง Active ต้องปิดก่อนข้ามรอบปีงบประมาณ
```

Questions to clarify:

1. Fiscal year ของบริษัทเริ่มและจบวันไหน?
2. ต้องแจ้งเตือนล่วงหน้ากี่วัน?
3. ถ้าเลย fiscal year แล้วยังไม่ปิด ระบบต้อง block อะไร?
4. Accounting/Admin override ได้ไหม?
5. Advance status `Closing` แต่ยังไม่ `Closed` ถือว่าผิด rule ไหม?

Recommended behavior:

```text
ก่อน fiscal year end 30 วัน: notify PC/PM/Accounting
หลัง fiscal year end: block new expense on active advance
ยังเปิดดูและ submit closing ได้
Admin/Accounting อาจ override ได้ตาม permission
```

---

## 5.11 Revision History / Action History

Known:

- ระบบต้องเก็บ submission เดิม
- return reason
- การเปลี่ยนแปลง
- resubmission history
- action history

Questions to clarify:

1. ต้องเก็บ field-level changes ไหม?
2. หรือเก็บแค่ action log ก็พอ?
3. ใครเห็น history ได้บ้าง?
4. Return reason แก้ย้อนหลังได้ไหม?
5. ต้อง export audit log ได้ไหม?
6. ต้องเก็บ IP/device ไหม?

Recommended tables:

```text
advance_action_logs
advance_revision_snapshots
```

Difference:

| Table | Purpose |
|---|---|
| advance_action_logs | เก็บว่าใครทำ action อะไร เมื่อไหร่ |
| advance_revision_snapshots | เก็บ snapshot ของข้อมูลแต่ละรอบ submit/resubmit |

---

## 5.12 Notification / Worklist

Events that may need notification:

| Event | Notify To |
|---|---|
| PC submits Advance Request | PM |
| PM returns request | PC |
| PM approves request | PC / Accounting |
| Accounting confirms disbursement | PC |
| PC submits closing | Accounting |
| Accounting returns closing | PC |
| Accounting confirms closed | PC / PM |
| Advance near fiscal year-end | PC / PM / Accounting |

Questions to clarify:

1. ต้องมี notification หรือไม่?
2. เป็น in-app notification, email, LINE, หรือแค่ worklist?
3. ต้องมี unread/read status ไหม?
4. ต้องแจ้งเตือนก่อน year-end กี่วัน?

Phase 1 recommendation:

```text
ใช้ in-app worklist + status filter ก่อน
ถ้าต้องการค่อยเพิ่ม email notification ภายหลัง
```

---

## 5.13 File Upload / Storage

Questions to clarify:

1. เก็บไฟล์ที่ไหน?
2. จำกัดขนาดไฟล์เท่าไหร่?
3. รองรับชนิดไฟล์อะไรบ้าง?
4. ลบไฟล์ได้ไหม หรือใช้ soft delete เท่านั้น?
5. Replace file ได้ไหม?
6. ต้องเก็บ file version ไหม?
7. ใครดูไฟล์ได้บ้าง?
8. ต้อง encrypt ไฟล์ไหม?
9. ต้องเก็บ original filename ไหม?

Recommended file metadata:

```text
file_id
owner_type
owner_id
file_name
file_type
mime_type
file_size
storage_url
uploaded_by
uploaded_at
```

---

## 5.14 Search / Filter / Worklist

Current known filter:

- Filter by status

Recommended filters:

| Filter | Recommendation |
|---|---|
| Status | Required |
| Project | Recommended |
| Project Code | Recommended |
| PM | Useful for Accounting/Admin |
| PC | Useful for PM/Accounting |
| Fiscal Year | Recommended |
| Date Range | Recommended |
| Amount Range | Optional |
| Department | Optional |
| Keyword Search | Recommended |

---

## 5.15 Numbering / Document Code

Questions to clarify:

1. Project Code generate ตาม pattern อะไร?
2. Advance Request No. generate ตาม pattern อะไร?
3. Expense No. generate ตาม pattern อะไร?
4. Closing No. generate ตาม pattern อะไร?
5. เลขเอกสาร reset ทุกปีไหม?

Example pattern:

```text
Project Code: PRJ-2026-0001
Advance Request No.: ADV-2026-0001
Expense No.: EXP-2026-0001
Closing No.: CLS-2026-0001
```

---

## 5.16 Accounting Process

Known:

- Accounting ดำเนินการจ่ายเงินจริงนอกระบบตาม financial process เดิม
- ระบบแค่ confirm ว่าจ่ายแล้ว

Questions to clarify:

1. Accounting ต้อง export ข้อมูลไปทำจ่ายเงินไหม?
2. ต้องเชื่อม ERP/accounting software ไหม?
3. ต้องเก็บ payment voucher no. ไหม?
4. ต้องเก็บ GL/account code ไหม?
5. ต้องมี cost center ไหม?
6. ต้องมี tax invoice info ไหม?

Phase 1 scope recommendation:

```text
ระบบไม่ทำ payment จริง
ระบบไม่เชื่อม accounting software
ระบบบันทึกเพียงว่า Accounting จ่ายแล้ว พร้อมรายละเอียดการจ่าย
```

---

# 6. Recommended Questions to Ask the Client

ใช้ชุดคำถามนี้ถามลูกค้าได้เลย:

```text
1. หนึ่ง Project สามารถมี PC หรือ PM ได้มากกว่า 1 คนไหม?
2. ต้องมี Admin สำหรับจัดการ User, Role, Project หรือไม่?
3. Project Code และ Advance Request No. ต้อง generate ตามรูปแบบใด?
4. Advance Amount มีวงเงินขั้นต่ำ/สูงสุดไหม และใช้สกุลเงิน THB เท่านั้นหรือไม่?
5. หลัง PM อนุมัติแล้ว ก่อน Accounting จ่ายเงินจริง ต้องมี status แยกเป็น Waiting for Disbursement หรือไม่?
6. หลัง MD เซ็นเอกสารกระดาษแล้ว ต้อง upload signed document กลับเข้าระบบหรือไม่?
7. Accounting ตอน Confirm Disbursement ต้องกรอกข้อมูลอะไรบ้าง เช่น วันที่จ่าย, ยอดจ่าย, วิธีจ่าย, reference no., proof of payment?
8. ถ้า Project มี Advance ที่ status Approved หรือ Closing อยู่แล้ว สามารถเปิด Advance ใหม่ได้ไหม หรือห้ามจนกว่าจะ Closed?
9. Expense สามารถเกิน Advance Amount ได้ไหม?
10. Expense ต้องมี category, vendor, receipt date, tax/VAT/WHT หรือไม่?
11. Receipt/Supporting Document รองรับไฟล์ประเภทอะไร และขนาดสูงสุดเท่าไหร่?
12. OCR result ต้องเก็บเฉพาะข้อมูลที่อ่านได้ หรือเก็บ raw result + confidence score ด้วย?
13. ถ้า OCR อ่านไม่ได้ PC สามารถกรอกเองทั้งหมดได้ไหม?
14. Closing Return Amount ต้องมีหลักฐานการคืนเงินไหม?
15. ถ้า Accounting return closing แล้ว Advance ควรอยู่ status อะไร?
16. Fiscal year ของบริษัทเริ่มและจบวันไหน?
17. ถ้า Advance ยัง Active หลัง fiscal year end ระบบต้อง block อะไร?
18. ต้องมี notification แบบ in-app/email หรือแค่ worklist ก็พอ?
19. ต้องมี report/export Excel/PDF สำหรับ Accounting หรือ Audit ไหม?
20. ต้องเก็บ history ระดับ field change หรือแค่ action log?
```

---

# 7. Recommended Next Artifacts

ก่อนเริ่มทำ migration หรือ API จริง แนะนำให้ทำเอกสารต่อไปนี้ก่อน:

1. **Status Transition Table**  
   เพื่อกำหนดว่าแต่ละ status เปลี่ยนไป status ไหนได้บ้าง และใครเป็นคนทำ action

2. **Role Permission Matrix**  
   เพื่อกำหนดสิทธิ์ของ PC, PM, Accounting, Admin อย่างชัดเจน

3. **ERD Draft / Database Schema**  
   เพื่อออกแบบตารางหลัก เช่น projects, advances, expenses, files, OCR results, action logs, revision snapshots

4. **API Endpoint Draft**  
   เพื่อกำหนด endpoint เช่น create advance, submit, approve, return, confirm disbursement, record expense, submit closing

---

# 8. Summary

Requirement ปัจจุบัน **ครบในระดับ business flow หลัก** แล้ว แต่ยังไม่ครบพอสำหรับ implement ระบบจริงทันที เพราะยังต้อง clarify เรื่องต่อไปนี้:

| Area | Status |
|---|---|
| Role & Permission | ยังต้องถามเพิ่ม |
| Status Lifecycle | ต้องนิยาม enum และ transition ให้ชัด |
| Advance Validation | ต้องกำหนด amount, currency, attachment, date rule |
| Document Generation | ต้องถาม template, document no., signed document upload |
| Disbursement Details | ต้องรู้ field ที่ Accounting ต้องกรอก |
| Active Advance Rule | ต้อง clarify ว่า status ไหนถือว่าขวางการเปิด Advance ใหม่ |
| Expense Validation | ต้องกำหนด category, vendor, edit/delete, over-budget rule |
| OCR | ต้องกำหนด provider, failure case, confidence, raw result |
| Closing | ต้อง clarify return amount, proof of return, over-advance case |
| Year-End Rule | ต้องรู้ fiscal year และระบบต้อง block/notify อย่างไร |
| Audit History | ต้องกำหนด action-level หรือ field-level history |
| Notification / Worklist | ต้องรู้ว่าต้อง notify แบบไหน |
| File Storage | ต้องกำหนด storage, file type, file size, permission |
| Accounting Process | ต้องรู้ว่าต้อง export/เชื่อมระบบบัญชีหรือไม่ |

ข้อสรุปสำคัญ:

```text
ยังไม่ควรเริ่ม migration ทันที
ควรล็อก Status Transition, Role Permission, และ ERD Draft ก่อน
```
