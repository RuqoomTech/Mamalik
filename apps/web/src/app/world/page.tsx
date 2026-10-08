import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import { Ledger, Section, formatLand } from "@/components/kingdom/KingdomPagePanels";
import { WorldMap } from "@/components/map/WorldMap";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";
import { getWorldKingdoms } from "@/lib/map/world-kingdoms";

export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
  const { kingdom } = dashboardData;
  const kingdoms = await getWorldKingdoms(kingdom.id);

  return (
    <KingdomAppShell activeSection="world" data={dashboardData} isAdmin={userIsAdmin}>
      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-mk-ink">World map</h2>
          <p className="text-sm text-mk-muted">
            {kingdoms.length} kingdom{kingdoms.length === 1 ? "" : "s"} · zoom in to see borders
          </p>
        </div>
        <WorldMap
          className="h-[65vh] min-h-[380px]"
          focus={{ lat: kingdom.centerLat, lng: kingdom.centerLng, zoom: 5 }}
          kingdoms={kingdoms}
          mapStyleUrl={mapStyleUrl}
        />
      </section>

      <Section title="Kingdoms by land">
        <Ledger>
          <thead>
            <tr>
              <th className="num w-12">#</th>
              <th>Kingdom</th>
              <th className="num">Land</th>
            </tr>
          </thead>
          <tbody>
            {kingdoms.slice(0, 25).map((entry, index) => (
              <tr key={entry.id}>
                <td className="num text-mk-muted">{index + 1}</td>
                <td className={entry.isOwn ? "font-semibold text-mk-green" : "font-medium"}>
                  {entry.name}
                  {entry.isOwn ? <span className="ml-2 text-xs font-normal text-mk-muted">you</span> : null}
                </td>
                <td className="num">{formatLand(entry.usableLandM2)}</td>
              </tr>
            ))}
          </tbody>
        </Ledger>
      </Section>
    </KingdomAppShell>
  );
}
