import Link from "next/link";
import { requireUserWithoutKingdom } from "@/lib/auth/guards";
import { KingdomLocationMap } from "@/components/map/KingdomLocationMap";

export const dynamic = "force-dynamic";

export default async function CreateKingdomPage() {
  const user = await requireUserWithoutKingdom();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";

  return (
    <main className="mamalik-page">
      <div className="mamalik-container space-y-6">
        <header className="mamalik-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="mamalik-eyebrow">Mamalik</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10140f]">
              Choose Your Kingdom Location
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f665d]">
              Start by selecting a point on the world map. New kingdoms begin with
              50,000 m2 usable land, and the final location must be valid land.
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              className="mamalik-action-secondary px-4 py-2"
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
            className="font-semibold text-[#183f35] underline"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
