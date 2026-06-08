import Link from "next/link";
import { requireUserWithKingdom } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUserWithKingdom();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Mamalik
            </p>
            <h1 className="text-3xl font-semibold text-neutral-950">Dashboard</h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
              type="submit"
            >
              Log out
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-neutral-200 p-5">
            <p className="text-sm text-neutral-500">Signed in</p>
            <p className="mt-1 text-lg font-medium text-neutral-950">
              {user.displayName}
            </p>
            <p className="text-sm text-neutral-600">{user.email}</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-5">
            <p className="text-sm text-neutral-500">Kingdom</p>
            <p className="mt-1 text-lg font-medium text-neutral-950">
              {user.kingdom.name}
            </p>
            <p className="text-sm text-neutral-600">Sprint 1 dashboard placeholder</p>
          </div>
        </section>

        <div>
          <Link
            className="text-sm font-medium text-neutral-950 underline"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
