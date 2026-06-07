export type RegisterInput = {
  email: string;
  displayName: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthValidationError = {
  field: "email" | "displayName" | "password";
  message: string;
};

export type AuthValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: AuthValidationError[] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_DISPLAY_NAME_LENGTH = 2;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeDisplayName(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizePassword(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function validateRegisterInput(input: Record<string, unknown>): AuthValidationResult<RegisterInput> {
  const email = normalizeEmail(input.email);
  const displayName = normalizeDisplayName(input.displayName);
  const password = normalizePassword(input.password);
  const errors: AuthValidationError[] = [];

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({ field: "email", message: "Enter a valid email address." });
  }

  if (
    displayName.length < MIN_DISPLAY_NAME_LENGTH ||
    displayName.length > MAX_DISPLAY_NAME_LENGTH
  ) {
    errors.push({
      field: "displayName",
      message: "Display name must be 2-50 characters.",
    });
  }

  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    errors.push({
      field: "password",
      message: "Password must be 8-128 characters.",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { email, displayName, password },
  };
}

export function validateLoginInput(input: Record<string, unknown>): AuthValidationResult<LoginInput> {
  const email = normalizeEmail(input.email);
  const password = normalizePassword(input.password);
  const errors: AuthValidationError[] = [];

  if (!EMAIL_PATTERN.test(email)) {
    errors.push({ field: "email", message: "Enter a valid email address." });
  }

  if (!password) {
    errors.push({ field: "password", message: "Enter your password." });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: { email, password },
  };
}
