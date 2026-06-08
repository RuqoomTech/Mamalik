import type { CurrentUser } from "./current-user";
import type { SessionRole } from "./session";
import { normalizeEmail } from "./validation";

export type RouteUser = {
  email: string;
  role: SessionRole;
  kingdom: CurrentUser["kingdom"];
};

export type PostLoginDestination = "/dashboard" | "/create-kingdom";

export function getPostLoginDestination(
  user: Pick<RouteUser, "kingdom">,
): PostLoginDestination {
  return user.kingdom ? "/dashboard" : "/create-kingdom";
}

export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

export function isAdminUser(
  user: Pick<RouteUser, "email" | "role">,
  adminEmails = process.env.ADMIN_EMAILS,
): boolean {
  if (user.role === "ADMIN") {
    return true;
  }

  return parseAdminEmails(adminEmails).has(normalizeEmail(user.email));
}
