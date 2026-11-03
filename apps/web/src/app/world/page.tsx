import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import { Ledger, Section } from "@/components/kingdom/KingdomPagePanels";
import { WorldMap } from "@/components/map/WorldMap";
import { formatArea } from "@/i18n/game-text";
import { plural } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";
import { getWorldKingdoms } from "@/lib/map/world-kingdoms";

export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const [{ dashboardData, userIsAdmin }, text] = await Promise.all([getKingdomPageData(), getI18n()]);
  const { locale, m } = text;
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
  const { kingdom } = dashboardData;
  const kingdoms = await getWorldKingdoms(kingdom.id);

  return (
    <KingdomAppShell activeSection="world" data={dashboardData} isAdmin={userIsAdmin}>
      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-mk-ink">{m.world.title}</h2>
          <p className="text-sm text-mk-muted">
            {plural(locale, m.world.kingdomCount, kingdoms.length)} · {m.world.zoomHint}
          </p>
        </div>
        <WorldMap
          className="h-[65vh] min-h-[380px]"
          focus={{ lat: kingdom.centerLat, lng: kingdom.centerLng, zoom: 5 }}
          kingdoms={kingdoms}
          mapStyleUrl={mapStyleUrl}
        />
      </section>

      <Section title={m.world.ranking}>
        <Ledger>
          <thead>
            <tr>
              <th className="num w-12">{m.world.rank}</th>
              <th>{m.world.kingdom}</th>
              <th className="num">{m.world.land}</th>
            </tr>
          </thead>
          <tbody>
            {kingdoms.slice(0, 25).map((entry, index) => (
              <tr key={entry.id}>
                <td className="num text-mk-muted">{index + 1}</td>
                <td className={entry.isOwn ? "font-semibold text-mk-accent" : "font-medium"}>
                  {entry.name}
                  {entry.isOwn ? <span className="ms-2 text-xs font-normal text-mk-muted">{m.common.you}</span> : null}
                </td>
                <td className="num">{formatArea(text, entry.usableLandM2)}</td>
              </tr>
            ))}
          </tbody>
        </Ledger>
      </Section>
    </KingdomAppShell>
  );
}
