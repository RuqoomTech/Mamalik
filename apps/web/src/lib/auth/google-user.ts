import type { SessionRole } from "./session";

export type GoogleIdentity = {
  subject: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
};

export type GoogleAuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: SessionRole;
  googleSubject: string | null;
};

export type GoogleUserRepository = {
  findByGoogleSubject(googleSubject: string): Promise<GoogleAuthUser | null>;
  findByEmail(email: string): Promise<GoogleAuthUser | null>;
  linkGoogleSubject(userId: string, googleSubject: string): Promise<GoogleAuthUser>;
  createGoogleUser(input: {
    email: string;
    displayName: string;
    googleSubject: string;
  }): Promise<GoogleAuthUser>;
};

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === "string" ? value.trim() : "";
}

function buildDisplayName(rawName: string, email: string): string {
  const fallback = email.split("@")[0] || email;
  const displayName = (rawName || fallback).trim().replace(/\s+/g, " ");

  return displayName.slice(0, 50);
}

export function normalizeGoogleIdentity(rawUserInfo: unknown): GoogleIdentity {
  if (!rawUserInfo || typeof rawUserInfo !== "object") {
    throw new Error("Google userinfo response is invalid.");
  }

  const userInfo = rawUserInfo as Record<string, unknown>;
  const subject = readString(userInfo, "sub");
  const email = readString(userInfo, "email").toLowerCase();
  const emailVerified = userInfo.email_verified === true;

  if (!subject || !email || !emailVerified) {
    throw new Error("Google userinfo response is missing a verified identity.");
  }

  return {
    subject,
    email,
    emailVerified,
    displayName: buildDisplayName(readString(userInfo, "name"), email),
  };
}

export async function upsertGoogleUser(
  repository: GoogleUserRepository,
  identity: GoogleIdentity,
): Promise<GoogleAuthUser> {
  const existingByGoogleSubject = await repository.findByGoogleSubject(identity.subject);

  if (existingByGoogleSubject) {
    return existingByGoogleSubject;
  }

  const existingByEmail = await repository.findByEmail(identity.email);

  if (existingByEmail) {
    if (existingByEmail.googleSubject && existingByEmail.googleSubject !== identity.subject) {
      throw new Error("Email is already linked to a different Google account.");
    }

    if (existingByEmail.googleSubject === identity.subject) {
      return existingByEmail;
    }

    return repository.linkGoogleSubject(existingByEmail.id, identity.subject);
  }

  return repository.createGoogleUser({
    email: identity.email,
    displayName: identity.displayName,
    googleSubject: identity.subject,
  });
}
