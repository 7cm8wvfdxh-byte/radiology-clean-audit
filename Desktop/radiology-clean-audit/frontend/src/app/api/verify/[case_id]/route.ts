import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_BASE!;

export async function GET(req: Request, ctx: { params: Promise<{ case_id: string }> }) {
  const { case_id } = await ctx.params;

  const { searchParams } = new URL(req.url);
  const sig = searchParams.get("sig");

  if (!sig) {
    return NextResponse.json({ error: "sig query param required" }, { status: 400 });
  }

  const url = `${backend}/verify/${encodeURIComponent(case_id)}?sig=${encodeURIComponent(sig)}`;
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
