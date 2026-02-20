import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_BASE!;

export async function GET(_req: Request, ctx: { params: { case_id: string } }) {
  const { case_id } = ctx.params;
  const res = await fetch(`${backend}/export/json/${encodeURIComponent(case_id)}`, { cache: "no-store" });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
