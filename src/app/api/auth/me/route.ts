import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";

  const upstream = await fetch(`${BACKEND}/api/v1/me`, {
    headers: { Authorization: authorization },
  });

  const json = await upstream.json();
  return NextResponse.json(json, { status: upstream.status });
}
