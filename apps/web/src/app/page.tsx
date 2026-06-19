import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPostLoginDestination, isAdminUser } from "@/lib/auth/route-destinations";

export default function Home() {
  return <HomeContent />;
}

async function HomeContent() {
  const user = await getCurrentUser();
  const appDestination = user ? getPostLoginDestination(user) : null;
  const appDestinationLabel = user?.kingdom ? "Open dashboard" : "Create kingdom";
  const userIsAdmin = user ? isAdminUser(user) : false;

  return (
    <main className="mamalik-page">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <section className="space-y-6">
            <div className="flex items-center gap-4">
              <Image
                src="/brand/mamalik-logo.png"
                alt="Mamalik emblem"
                width={88}
                height={88}
                priority
                className="size-20 rounded-md border border-[#dfe5dc] bg-white object-cover shadow-sm sm:size-24"
              />
              <div>
                <p className="mamalik-eyebrow">Mamalik</p>
                <p className="text-xl font-semibold text-[#10140f]">ممالك</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#10140f] sm:text-5xl">
                Build your kingdom on the world map.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#5f665d]">
                Mamalik v0.1 starts with account access, map-selected kingdom
                creation, starter districts, and a read-only kingdom command view.
              </p>
            </div>
          </section>

          {user ? (
            <section className="mamalik-card p-5">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-[#5f665d]">Signed in as</p>
                  <p className="mt-1 text-xl font-semibold text-[#10140f]">
                    {user.displayName}
                  </p>
                  <p className="text-sm text-[#5f665d]">{user.email}</p>
                </div>

                {user.kingdom ? (
                  <div className="rounded-md border border-[#dfe5dc] bg-[#f7f8f4] p-3">
                    <p className="text-sm text-[#5f665d]">Kingdom</p>
                    <p className="mt-1 font-semibold text-[#10140f]">
                      {user.kingdom.name}
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-3">
                  {appDestination ? (
                    <Link
                      className="mamalik-action-primary flex items-center justify-center px-4 py-2.5"
                      href={appDestination}
                    >
                      {appDestinationLabel}
                    </Link>
                  ) : null}
                  {userIsAdmin ? (
                    <Link
                      className="mamalik-action-secondary flex items-center justify-center px-4 py-2.5"
                      href="/admin"
                    >
                      Admin panel
                    </Link>
                  ) : null}
                  <form action="/api/auth/logout" method="post">
                    <button
                      className="mamalik-action-secondary w-full px-4 py-2.5"
                      type="submit"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </div>
            </section>
          ) : (
            <section className="mamalik-card p-5">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-[#5f665d]">Start v0.1</p>
                  <p className="mt-1 text-xl font-semibold text-[#10140f]">
                    Create or access your account
                  </p>
                </div>
                <div className="grid gap-3">
                  <Link
                    className="mamalik-action-primary flex items-center justify-center px-4 py-2.5"
                    href="/register"
                  >
                    Register
                  </Link>
                  <Link
                    className="mamalik-action-secondary flex items-center justify-center px-4 py-2.5"
                    href="/login"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
