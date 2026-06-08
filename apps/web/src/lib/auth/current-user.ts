import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/db/client";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionRole } from "./session";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: SessionRole;
  kingdom: {
    id: string;
    name: string;
  } | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await getPrismaClient().user.findUnique({
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

  return user;
}
