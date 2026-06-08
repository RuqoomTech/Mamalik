import Link from "next/link";
import { requireUserWithoutKingdom } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CreateKingdomPage() {
  const user = await requireUserWithoutKingdom();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10">
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Mamalik
            </p>
            <h1 className="text-3xl font-semibold text-neutral-950">
              Create Kingdom
            </h1>
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

        <section className="rounded-md border border-neutral-200 p-5">
          <p className="text-sm text-neutral-500">Signed in</p>
          <p className="mt-1 text-lg font-medium text-neutral-950">
            {user.displayName}
          </p>
          <p className="text-sm text-neutral-600">{user.email}</p>
        </section>

        <section className="rounded-md border border-neutral-200 p-5">
          <p className="text-lg font-medium text-neutral-950">
            Kingdom creation starts here.
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            Sprint 1 map selection and temporary location validation begin in S1-010.
          </p>
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
