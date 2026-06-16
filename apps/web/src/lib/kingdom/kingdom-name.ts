export const KINGDOM_NAME_MIN_LENGTH = 2;
export const KINGDOM_NAME_MAX_LENGTH = 32;

export type KingdomNameValidationResult =
  | { ok: true; name: string }
  | { ok: false; reason: "required" | "too-short" | "too-long" | "unsafe-characters" };

export function normalizeKingdomName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateKingdomName(value: string): KingdomNameValidationResult {
  if (/[\u0000-\u001F\u007F]/.test(value)) {
    return { ok: false, reason: "unsafe-characters" };
  }

  const name = normalizeKingdomName(value);

  if (!name) {
    return { ok: false, reason: "required" };
  }

  if (name.length < KINGDOM_NAME_MIN_LENGTH) {
    return { ok: false, reason: "too-short" };
  }

  if (name.length > KINGDOM_NAME_MAX_LENGTH) {
    return { ok: false, reason: "too-long" };
  }

  return { ok: true, name };
}

export function formatKingdomNameError(result: KingdomNameValidationResult): string | null {
  if (result.ok) {
    return null;
  }

  switch (result.reason) {
    case "required":
      return "Kingdom name is required.";
    case "too-short":
      return "Kingdom name must be at least 2 characters.";
    case "too-long":
      return "Kingdom name must be 32 characters or fewer.";
    case "unsafe-characters":
      return "Kingdom name contains unsupported characters.";
  }
}

function truncateBaseName(baseName: string): string {
  const suffix = " Kingdom";
  const maxBaseLength = KINGDOM_NAME_MAX_LENGTH - suffix.length;
  const truncatedBaseName = baseName.slice(0, maxBaseLength).trim();

  return truncatedBaseName || "New";
}

export function suggestKingdomName(displayName: string | null | undefined): string {
  const normalizedDisplayName = normalizeKingdomName(displayName ?? "");

  if (!normalizedDisplayName) {
    return "New Kingdom";
  }

  return `${truncateBaseName(normalizedDisplayName)} Kingdom`;
}
