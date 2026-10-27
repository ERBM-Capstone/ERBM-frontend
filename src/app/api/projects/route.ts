import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization");
  const search = req.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/v1/projects${search ? `?${search}` : ""}`;

  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: token } : {}),
    },
  });

  const json = await res.json();
  return NextResponse.json(json, { status: res.status });
}
