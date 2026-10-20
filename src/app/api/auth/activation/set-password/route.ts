import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const upstream = await fetch(
    `${BACKEND}/api/v1/auth/activation/set-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }
  );

  const json = await upstream.json();
  return NextResponse.json(json, { status: upstream.status });
}
