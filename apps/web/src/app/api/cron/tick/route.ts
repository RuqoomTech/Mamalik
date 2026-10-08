import { NextResponse } from "next/server";
import { runOneTick } from "../../../../../../../workers/tick-worker/src/run-one-tick";
import { serializeAdminTickResult } from "@/lib/admin/admin-tick";
import { isAuthorizedCronRequest } from "@/lib/admin/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Scheduled tick entry point. A scheduler (Supabase pg_cron, Vercel Cron, or any external
// cron) calls this every 10 minutes with `Authorization: Bearer <CRON_SECRET>`. Duplicate
// calls inside the same 10-minute slot are skipped by the TickLog unique key.
async function handleTick(request: Request): Promise<NextResponse> {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const result = serializeAdminTickResult(await runOneTick());

  return NextResponse.json(
    {
      ok: result.status !== "FAILED",
      tickKey: result.tickKey,
      status: result.status,
      processedKingdomCount: result.processedKingdomCount,
      errorMessage: result.errorMessage,
    },
    { status: result.status === "FAILED" ? 500 : 200 },
  );
}

export const GET = handleTick;
export const POST = handleTick;
