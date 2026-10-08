import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import { formatLand } from "@/components/kingdom/KingdomPagePanels";
import { KingdomBorderMapPreview } from "@/components/map/KingdomBorderMapPreview";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
  const { kingdom } = dashboardData;

  return (
    <KingdomAppShell activeSection="world" data={dashboardData} isAdmin={userIsAdmin}>
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="mamalik-display text-2xl text-mk-ink sm:text-3xl">World map</h2>
          <p className="text-sm text-mk-muted">
            Your border covers {formatLand(kingdom.visibleAreaM2)} on the map
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-mk-line">
          <KingdomBorderMapPreview
            centerLat={kingdom.centerLat}
            centerLng={kingdom.centerLng}
            className="h-[60vh] min-h-[360px]"
            interactive
            mapStyleUrl={mapStyleUrl}
            visibleBorderGeojson={kingdom.visibleBorderGeojson}
          />
        </div>
      </section>
    </KingdomAppShell>
  );
}
