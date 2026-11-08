import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  const search = req.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/v1/employees${search ? `?${search}` : ""}`;

  const response = await fetch(url, {
    headers: authorization ? { Authorization: authorization } : {},
  });
  const body = await response.json();

  return NextResponse.json(body, { status: response.status });
}
