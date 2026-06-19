import Image from "next/image";
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
                <h1 className="text-3xl font-semibold text-[#10140f]">Log in</h1>
              </div>
            </div>

            <p className="text-sm leading-6 text-[#5f665d]">
              Access your account before creating or managing a kingdom.
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

            <form action="/api/auth/login" method="post" className="space-y-4">
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
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                className="mamalik-action-primary w-full px-4 py-2.5"
                type="submit"
              >
                Log in
              </button>
            </form>

            <p className="text-sm text-[#5f665d]">
              No account yet?{" "}
              <Link className="font-semibold text-[#183f35] underline" href="/register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
