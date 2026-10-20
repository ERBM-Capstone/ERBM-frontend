import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function POST(req: NextRequest) {
  // Forward the refresh_token cookie to the backend
  const cookie = req.headers.get("cookie") ?? "";

  const upstream = await fetch(`${BACKEND}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { cookie },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const json = await upstream.json();
  return NextResponse.json(json, { status: upstream.status });
}
