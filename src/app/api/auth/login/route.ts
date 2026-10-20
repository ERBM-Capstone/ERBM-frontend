import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const upstream = await fetch(`${BACKEND}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const json = await upstream.json();

  const res = NextResponse.json(json, { status: upstream.status });

  // Forward the HttpOnly refresh_token cookie set by the backend
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) {
    res.headers.set("set-cookie", setCookie);
  }

  return res;
}
