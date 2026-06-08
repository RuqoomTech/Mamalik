export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  appUrl: string;
  redirectUri: string;
};

type GoogleTokenResponse = {
  access_token?: string;
};

function requiredEnv(
  env: NodeJS.ProcessEnv,
  key: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "NEXT_PUBLIC_APP_URL",
): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required for Google login.`);
  }

  return value;
}

function normalizeAppUrl(appUrl: string): string {
  const normalized = appUrl.replace(/\/+$/, "");

  try {
    return new URL(normalized).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be an absolute URL for Google login.");
  }
}

export function getGoogleOAuthConfig(env: NodeJS.ProcessEnv = process.env): GoogleOAuthConfig {
  const appUrl = normalizeAppUrl(requiredEnv(env, "NEXT_PUBLIC_APP_URL"));

  return {
    clientId: requiredEnv(env, "GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnv(env, "GOOGLE_CLIENT_SECRET"),
    appUrl,
    redirectUri: `${appUrl}/api/auth/google/callback`,
  };
}

export function buildGoogleAuthorizationUrl(
  config: GoogleOAuthConfig,
  state: string,
): URL {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return url;
}

export async function exchangeGoogleAuthorizationCode(
  code: string,
  config: GoogleOAuthConfig,
  fetchImplementation: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImplementation("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error("Google authorization code exchange failed.");
  }

  const tokenResponse = (await response.json()) as GoogleTokenResponse;

  if (!tokenResponse.access_token) {
    throw new Error("Google token response did not include an access token.");
  }

  return tokenResponse.access_token;
}

export async function fetchGoogleUserInfo(
  accessToken: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<unknown> {
  const response = await fetchImplementation("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Google userinfo request failed.");
  }

  return response.json();
}
