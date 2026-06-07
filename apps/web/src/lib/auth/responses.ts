import { NextResponse } from "next/server";

type AuthUserResponse = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

export function authSuccessResponse(
  request: Request,
  wantsJson: boolean,
  user: AuthUserResponse,
): NextResponse {
  if (wantsJson) {
    return NextResponse.json({ user });
  }

  return NextResponse.redirect(new URL("/", request.url), 303);
}

export function authFailureResponse(
  request: Request,
  wantsJson: boolean,
  status: number,
  redirectPath: "/login" | "/register",
  code: string,
  message: string,
): NextResponse {
  if (wantsJson) {
    return NextResponse.json({ error: { code, message } }, { status });
  }

  const redirectUrl = new URL(redirectPath, request.url);
  redirectUrl.searchParams.set("error", code);

  return NextResponse.redirect(redirectUrl, 303);
}
