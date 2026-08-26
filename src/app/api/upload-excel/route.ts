import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { parseExcelBuffer, syncItemsToStore } from "@/lib/excel-data";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Please select a valid Excel file (.xlsx) to upload." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcelBuffer(buffer);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Could not parse data from the uploaded file. Please ensure it is a valid Summary.xlsx file.",
        },
        { status: 400 },
      );
    }

    try {
      syncItemsToStore(parsed);
    } catch {
      // Browser localStorage is the durable source on serverless.
    }

    return NextResponse.json({
      syncedAt: new Date().toISOString(),
      activeItems: parsed.activeItems,
      historyItems: parsed.historyItems,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 },
    );
  }
}
