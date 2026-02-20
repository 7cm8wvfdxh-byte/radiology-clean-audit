import { NextResponse } from "next/server";

const backend = process.env.NEXT_PUBLIC_API_BASE!;

export async function GET(_req: Request, ctx: { params: { case_id: string } }) {
  const { case_id } = ctx.params;

  const res = await fetch(`${backend}/export/pdf/${encodeURIComponent(case_id)}`, { cache: "no-store" });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "BACKEND_PDF_ERROR", status: res.status, body: text },
      { status: 500 }
    );
  }

  const blob = await res.blob();
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") || "application/pdf",
      "content-disposition": res.headers.get("content-disposition") || `attachment; filename="${case_id}.pdf"`,
    },
  });
}
