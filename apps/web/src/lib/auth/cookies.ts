import type { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./session";

const secureCookies = process.env.NODE_ENV === "production";

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
    maxAge: 0,
  });
}
