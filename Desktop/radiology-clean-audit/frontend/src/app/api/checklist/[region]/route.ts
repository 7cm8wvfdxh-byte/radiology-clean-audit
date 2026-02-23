import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ region: string }> }
) {
  const { region } = await ctx.params;
  const res = await fetch(`${BACKEND}/checklist/${region}`, {
    headers: { Authorization: req.headers.get("authorization") || "" },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
