import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  const search = req.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/v1/advances${search ? `?${search}` : ""}`;

  const response = await fetch(url, {
    headers: authorization ? { Authorization: authorization } : {},
  });
  const body = await response.json();

  return NextResponse.json(body, { status: response.status });
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  const body = await req.json();
  const response = await fetch(`${BACKEND_URL}/api/v1/advances`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(body),
  });
  const result = await response.json();

  return NextResponse.json(result, { status: response.status });
}
