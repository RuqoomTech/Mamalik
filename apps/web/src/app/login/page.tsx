import Link from "next/link";
import { redirectAuthenticatedUserFromAuthPage } from "@/lib/auth/guards";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "invalid-login": "Email or password is incorrect.",
  "google-login-failed": "Google login failed. Try again or use email and password.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectAuthenticatedUserFromAuthPage();

  const params = await searchParams;
  const error = params?.error ? errorMessages[params.error] : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
            Mamalik
          </p>
          <h1 className="text-3xl font-semibold text-neutral-950">Log in</h1>
          <p className="text-sm text-neutral-600">
            Access your account before creating or managing a kingdom.
          </p>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Link
          className="flex w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-50"
          href="/api/auth/google"
        >
          Continue with Google
        </Link>

        <form action="/api/auth/login" method="post" className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-800">Email</span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-950 outline-none focus:border-neutral-950"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-800">Password</span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-950 outline-none focus:border-neutral-950"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            type="submit"
          >
            Log in
          </button>
        </form>

        <p className="text-sm text-neutral-600">
          No account yet?{" "}
          <Link className="font-medium text-neutral-950 underline" href="/register">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
