import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/db/client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  return getPrismaClient().user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      kingdom: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
