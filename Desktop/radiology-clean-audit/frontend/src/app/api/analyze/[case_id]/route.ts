import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: Request, ctx: { params: Promise<{ case_id: string }> }) {
  const { case_id } = await ctx.params;
  const body = await req.text();

  const res = await fetch(`${backend}/analyze/${encodeURIComponent(case_id)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
