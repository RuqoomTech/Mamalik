import { getPrismaClient } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { readAuthRequestBody } from "@/lib/auth/request";
import { authFailureResponse, authSuccessResponse } from "@/lib/auth/responses";
import { createSessionPayload, createSessionToken } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { validateRegisterInput } from "@/lib/auth/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { input, wantsJson } = await readAuthRequestBody(request);
  const validation = validateRegisterInput(input);

  if (!validation.ok) {
    return authFailureResponse(
      request,
      wantsJson,
      400,
      "/register",
      "invalid-registration",
      validation.errors[0]?.message ?? "Registration details are invalid.",
    );
  }

  const prisma = getPrismaClient();
  const existingUser = await prisma.user.findUnique({
    where: { email: validation.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return authFailureResponse(
      request,
      wantsJson,
      409,
      "/register",
      "email-taken",
      "An account with that email already exists.",
    );
  }

  const passwordHash = await hashPassword(validation.data.password);
  const user = await prisma.user.create({
    data: {
      email: validation.data.email,
      displayName: validation.data.displayName,
      passwordHash,
      authProvider: "EMAIL",
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
    },
  });

  const token = createSessionToken(createSessionPayload(user));
  const response = authSuccessResponse(request, wantsJson, user);
  setSessionCookie(response, token);

  return response;
}
