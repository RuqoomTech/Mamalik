import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./current-user";
import { getPostLoginDestination, isAdminUser } from "./route-destinations";

export type CurrentUserWithKingdom = CurrentUser & {
  kingdom: NonNullable<CurrentUser["kingdom"]>;
};

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireUserWithKingdom(): Promise<CurrentUserWithKingdom> {
  const user = await requireCurrentUser();

  if (!user.kingdom) {
    redirect("/create-kingdom");
  }

  return user as CurrentUserWithKingdom;
}

export async function requireUserWithoutKingdom(): Promise<CurrentUser> {
  const user = await requireCurrentUser();

  if (user.kingdom) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireCurrentUser();

  if (!isAdminUser(user)) {
    redirect(getPostLoginDestination(user));
  }

  return user;
}

export async function redirectAuthenticatedUserFromAuthPage(): Promise<void> {
  const user = await getCurrentUser();

  if (user) {
    redirect(getPostLoginDestination(user));
  }
}
