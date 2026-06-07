export type AuthRequestBody = {
  input: Record<string, unknown>;
  wantsJson: boolean;
};

export async function readAuthRequestBody(request: Request): Promise<AuthRequestBody> {
  const contentType = request.headers.get("content-type") ?? "";
  const wantsJson = contentType.includes("application/json");

  if (wantsJson) {
    try {
      const body = (await request.json()) as unknown;

      return {
        input: isRecord(body) ? body : {},
        wantsJson,
      };
    } catch {
      return { input: {}, wantsJson };
    }
  }

  const formData = await request.formData();
  const input: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    input[key] = typeof value === "string" ? value : "";
  }

  return { input, wantsJson };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
