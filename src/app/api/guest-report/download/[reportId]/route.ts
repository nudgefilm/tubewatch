import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type GuestReportRow = {
  id: string;
  pdf_url: string | null;
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  const { reportId } = await context.params;
  if (!reportId?.trim()) {
    return NextResponse.json(
      { message: "Missing report id" },
      { status: 400 }
    );
  }

  const { data: row, error: selectError } = await supabaseAdmin
    .from("guest_reports")
    .select("id, pdf_url")
    .eq("id", reportId)
    .maybeSingle<GuestReportRow>();

  if (selectError) {
    return NextResponse.json(
      { message: "Failed to load report" },
      { status: 500 }
    );
  }

  if (!row || !row.pdf_url?.trim()) {
    return NextResponse.json(
      { message: "Report not found or PDF not ready" },
      { status: 404 }
    );
  }

  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from("guest-reports")
    .download(row.pdf_url);

  if (downloadError || !fileData) {
    return NextResponse.json(
      { message: downloadError?.message ?? "PDF download failed" },
      { status: 500 }
    );
  }

  const arrayBuffer = await fileData.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tubewatch-strategy-report-${reportId}.pdf"`,
    },
  });
}
