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
    // The backend scopes the cookie to /api/v1/auth, but the browser talks to
    // this same-origin proxy at /api/auth. Align the browser path with the proxy.
    res.headers.set(
      "set-cookie",
      setCookie.replace(/(;\s*Path=)[^;]*/i, "$1/api/auth")
    );
  }

  return res;
}
