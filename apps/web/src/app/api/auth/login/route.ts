import { getPrismaClient } from "@/lib/db/client";
import { setSessionCookie } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { readAuthRequestBody } from "@/lib/auth/request";
import { authFailureResponse, authSuccessResponse } from "@/lib/auth/responses";
import { createSessionPayload, createSessionToken } from "@/lib/auth/session";
import { validateLoginInput } from "@/lib/auth/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { input, wantsJson } = await readAuthRequestBody(request);
  const validation = validateLoginInput(input);

  if (!validation.ok) {
    return authFailureResponse(
      request,
      wantsJson,
      400,
      "/login",
      "invalid-login",
      "Email or password is incorrect.",
    );
  }

  const user = await getPrismaClient().user.findUnique({
    where: { email: validation.data.email },
    select: {
      id: true,
      email: true,
      displayName: true,
      passwordHash: true,
      role: true,
    },
  });

  const passwordMatches =
    user?.passwordHash &&
    (await verifyPassword(validation.data.password, user.passwordHash));

  if (!user || !passwordMatches) {
    return authFailureResponse(
      request,
      wantsJson,
      401,
      "/login",
      "invalid-login",
      "Email or password is incorrect.",
    );
  }

  const responseUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
  const token = createSessionToken(createSessionPayload(responseUser));
  const response = authSuccessResponse(request, wantsJson, responseUser);
  setSessionCookie(response, token);

  return response;
}
