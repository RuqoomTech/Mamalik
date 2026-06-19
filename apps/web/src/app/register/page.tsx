import Image from "next/image";
import Link from "next/link";
import { GoogleLegalNotice, LegalLinks } from "@/components/legal/LegalLinks";
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
    <main className="mamalik-page">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mamalik-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Image
                src="/brand/mamalik-logo.png"
                alt="Mamalik emblem"
                width={64}
                height={64}
                priority
                className="size-16 rounded-md border border-[#dfe5dc] bg-white object-cover shadow-sm"
              />
              <div>
                <p className="mamalik-eyebrow">Mamalik</p>
                <h1 className="text-3xl font-semibold text-[#10140f]">Register</h1>
              </div>
            </div>

            <p className="text-sm leading-6 text-[#5f665d]">
              Create the account that will own your first kingdom.
            </p>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Link
              className="mamalik-action-secondary flex w-full items-center justify-center px-4 py-2.5"
              href="/api/auth/google"
            >
              Continue with Google
            </Link>
            <GoogleLegalNotice />

            <form action="/api/auth/register" method="post" className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#10140f]">
                  Display name
                </span>
                <input
                  className="mamalik-input px-3 py-2"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={50}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#10140f]">Email</span>
                <input
                  className="mamalik-input px-3 py-2"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[#10140f]">Password</span>
                <input
                  className="mamalik-input px-3 py-2"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>

              <button
                className="mamalik-action-primary w-full px-4 py-2.5"
                type="submit"
              >
                Register
              </button>
            </form>

            <p className="text-sm text-[#5f665d]">
              Already have an account?{" "}
              <Link className="font-semibold text-[#183f35] underline" href="/login">
                Log in
              </Link>
            </p>
            <LegalLinks />
          </div>
        </div>
      </div>
    </main>
  );
}
