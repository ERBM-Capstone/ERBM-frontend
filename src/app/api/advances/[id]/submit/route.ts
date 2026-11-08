import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorization = req.headers.get("authorization");
  const response = await fetch(`${BACKEND_URL}/api/v1/advances/${encodeURIComponent(id)}/submit`, {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });
  const body = await response.json();
  return NextResponse.json(body, { status: response.status });
}
