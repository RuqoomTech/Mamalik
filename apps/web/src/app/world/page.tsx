import { getLandAreaTypeLabel } from "@mamalik/game";
import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  SummaryCard,
  formatCoordinate,
  formatLand,
} from "@/components/kingdom/KingdomPagePanels";
import { KingdomBorderMapPreview } from "@/components/map/KingdomBorderMapPreview";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";

  return (
    <KingdomAppShell
      activeSection="world"
      isAdmin={userIsAdmin}
      kingdomName={dashboardData.kingdom.name}
      kingdomSlug={dashboardData.kingdom.slug}
    >
      <section className="space-y-3">
        <div>
          <p className="mamalik-eyebrow">World map</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#10140f]">
            Kingdom border and center point
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-[#5f665d]">
            This page focuses on the kingdom location and server-generated visible border.
            Gameplay usable land remains separate from the visible polygon area.
          </p>
        </div>
        <KingdomBorderMapPreview
          centerLat={dashboardData.kingdom.centerLat}
          centerLng={dashboardData.kingdom.centerLng}
          className="h-[620px]"
          interactive
          mapStyleUrl={mapStyleUrl}
          visibleBorderGeojson={dashboardData.kingdom.visibleBorderGeojson}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          detail="Kingdom center"
          label="Latitude"
          value={formatCoordinate(dashboardData.kingdom.centerLat)}
        />
        <SummaryCard
          detail="Kingdom center"
          label="Longitude"
          value={formatCoordinate(dashboardData.kingdom.centerLng)}
        />
        <SummaryCard
          detail="Gameplay land credit"
          label="Usable land"
          value={formatLand(dashboardData.kingdom.usableLandM2)}
        />
        <SummaryCard
          detail="Measured map polygon"
          label="Visible area"
          value={formatLand(dashboardData.kingdom.visibleAreaM2)}
        />
        <SummaryCard
          detail="v0.1 classification"
          label="Area type"
          value={getLandAreaTypeLabel(dashboardData.kingdom.areaType)}
        />
      </section>
    </KingdomAppShell>
  );
}
