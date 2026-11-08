import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function POST(req: NextRequest) {
  const cookie = req.headers.get("cookie") ?? "";

  const upstream = await fetch(`${BACKEND}/api/v1/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });

  const res = NextResponse.json({ success: true }, { status: 200 });

  // Forward the cookie-clearing header from backend
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) {
    // Clear the browser cookie using the same path applied by the login proxy.
    res.headers.set(
      "set-cookie",
      setCookie.replace(/(;\s*Path=)[^;]*/i, "$1/api/auth")
    );
  }

  return res;
}
