import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return NextResponse.json({ message: "รหัสคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  if (!BACKEND_URL) {
    return NextResponse.json({ message: "ยังไม่ได้ตั้งค่าการเชื่อมต่อ backend" }, { status: 503 });
  }

  const authorization = req.headers.get("authorization");
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/advances/${id}/confirm-disbursement`, {
      method: "POST",
      headers: authorization ? { Authorization: authorization } : {},
    });
    const body = await response.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "backend ส่งผลการยืนยันจ่ายกลับมาไม่ถูกต้อง" }, { status: 502 });
    }
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ message: "เชื่อมต่อ backend เพื่อยืนยันการจ่ายไม่สำเร็จ" }, { status: 502 });
  }
}
