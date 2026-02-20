import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_BASE!;

export async function GET() {
  const res = await fetch(`${backend}/cases`, { cache: "no-store" });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
