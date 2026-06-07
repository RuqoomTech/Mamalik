import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const wantsJson = contentType.includes("application/json");
  const response = wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL("/login", request.url), 303);

  clearSessionCookie(response);

  return response;
}
