import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "";
  const url = status ? `${BACKEND}/second-readings?status=${status}` : `${BACKEND}/second-readings`;
  const res = await fetch(url, {
    headers: { Authorization: req.headers.get("authorization") || "" },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BACKEND}/second-readings`, {
    method: "POST",
    headers: {
      Authorization: req.headers.get("authorization") || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
