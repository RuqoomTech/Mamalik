import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";

export default function Home() {
  return <HomeContent />;
}

async function HomeContent() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Image
              src="/brand/mamalik-logo.png"
              alt="Mamalik emblem"
              width={88}
              height={88}
              priority
              className="size-20 rounded-md border border-neutral-200 bg-white object-cover shadow-sm sm:size-24"
            />
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                Mamalik
              </p>
              <p className="text-lg font-semibold text-neutral-950">ممالك</p>
            </div>
          </div>
          <h1 className="text-4xl font-semibold text-neutral-950">
            Build your kingdom on the world map.
          </h1>
          <p className="max-w-xl text-base text-neutral-600">
            Sprint 1 is building the account and kingdom creation foundation for
            the v0.1 browser strategy MMO.
          </p>
        </div>

        {user ? (
          <section className="space-y-4 rounded-md border border-neutral-200 p-5">
            <div>
              <p className="text-sm text-neutral-500">Signed in as</p>
              <p className="text-lg font-medium text-neutral-950">
                {user.displayName}
              </p>
              <p className="text-sm text-neutral-600">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
                type="submit"
              >
                Log out
              </button>
            </form>
          </section>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              href="/register"
            >
              Register
            </Link>
            <Link
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
              href="/login"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
