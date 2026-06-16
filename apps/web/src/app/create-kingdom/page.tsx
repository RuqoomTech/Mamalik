import Link from "next/link";
import { requireUserWithoutKingdom } from "@/lib/auth/guards";
import { KingdomLocationMap } from "@/components/map/KingdomLocationMap";

export const dynamic = "force-dynamic";

export default async function CreateKingdomPage() {
  const user = await requireUserWithoutKingdom();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Mamalik
            </p>
            <h1 className="text-3xl font-semibold text-neutral-950">
              Choose Your Kingdom Location
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">
              Start by selecting a point on the world map. New kingdoms begin with
              50,000 m2 usable land, and the final location must be valid land.
            </p>
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

        <KingdomLocationMap
          mapStyleUrl={mapStyleUrl}
          playerDisplayName={user.displayName}
          playerEmail={user.email}
        />

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
