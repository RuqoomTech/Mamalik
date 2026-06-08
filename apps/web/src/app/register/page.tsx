import Link from "next/link";
import { redirectAuthenticatedUserFromAuthPage } from "@/lib/auth/guards";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "email-taken": "An account with that email already exists.",
  "invalid-registration": "Check the registration details and try again.",
  "google-login-failed": "Google login failed. Try again or register with email.",
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
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
          <h1 className="text-3xl font-semibold text-neutral-950">Register</h1>
          <p className="text-sm text-neutral-600">
            Create the account that will own your first kingdom.
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

        <form action="/api/auth/register" method="post" className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-800">Display name</span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-950 outline-none focus:border-neutral-950"
              name="displayName"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={50}
              required
            />
          </label>

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
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </label>

          <button
            className="w-full rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            type="submit"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-neutral-600">
          Already have an account?{" "}
          <Link className="font-medium text-neutral-950 underline" href="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
