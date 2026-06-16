import {
  STARTER_BUILDINGS,
  STARTER_UNITS,
  STARTING_DISTRICTS,
} from "@mamalik/game/constants";
import { getPrismaClient } from "@/lib/db/client";

export const DASHBOARD_STATUS_NOTE =
  "Economy ticks, construction, training, land buying, scouting, combat, and alliances are coming in later v0.1 sprints.";

export type DashboardSourceKingdom = {
  id: string;
  name: string;
  slug: string;
  centerLat: number;
  centerLng: number;
  protectionEndsAt: Date;
  usableLandM2: number;
  usedLandM2: number;
  visibleAreaM2: number;
  population: number;
  resourceStockpile: {
    money: number;
    food: number;
    manpower: number;
    knowledge: number;
  } | null;
  districts: Array<{
    id: string;
    type: string;
    allocatedLandM2: number;
    usedLandM2: number;
  }>;
  buildings: Array<{
    id: string;
    type: string;
    level: number;
    status: string;
    landUsedM2: number;
    district: {
      type: string;
    };
  }>;
  unitStacks: Array<{
    id: string;
    unitType: string;
    quantity: number;
    locationType: string;
  }>;
};

export type KingdomDashboardData = {
  kingdom: {
    id: string;
    name: string;
    slug: string;
    centerLat: number;
    centerLng: number;
    protectionEndsAt: Date;
    protectionRemaining: string;
    usableLandM2: number;
    usedLandM2: number;
    freeLandM2: number;
    visibleAreaM2: number;
    population: number;
  };
  resources: {
    money: number;
    food: number;
    manpower: number;
    knowledge: number;
  };
  districts: Array<{
    id: string;
    type: string;
    label: string;
    allocatedLandM2: number;
    usedLandM2: number;
    freeLandM2: number;
  }>;
  buildings: Array<{
    id: string;
    type: string;
    label: string;
    level: number;
    status: string;
    statusLabel: string;
    landUsedM2: number;
    districtType: string;
    districtLabel: string;
  }>;
  army: Array<{
    id: string;
    unitType: string;
    label: string;
    quantity: number;
    locationType: string;
    locationLabel: string;
  }>;
};

const districtOrder: string[] = STARTING_DISTRICTS.map((district) => district.type);
const districtLabels = new Map<string, string>(
  STARTING_DISTRICTS.map((district) => [district.type, district.label]),
);
const buildingLabels = new Map<string, string>(
  STARTER_BUILDINGS.map((building) => [building.type, building.label]),
);
const unitLabels = new Map<string, string>(
  STARTER_UNITS.map((unit) => [unit.type, unit.label]),
);

export function calculateFreeLandM2(totalLandM2: number, usedLandM2: number): number {
  return totalLandM2 - usedLandM2;
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function getDistrictSortIndex(type: string): number {
  const index = districtOrder.indexOf(type);

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function getDistrictLabel(type: string): string {
  return districtLabels.get(type) ?? formatEnumLabel(type);
}

function getBuildingLabel(type: string): string {
  return buildingLabels.get(type) ?? formatEnumLabel(type);
}

function getUnitLabel(type: string): string {
  return unitLabels.get(type) ?? formatEnumLabel(type);
}

export function getProtectionRemainingText(protectionEndsAt: Date, now = new Date()): string {
  const remainingMs = protectionEndsAt.getTime() - now.getTime();

  if (remainingMs <= 0) {
    return "Protection ended";
  }

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} day${days === 1 ? "" : "s"}`);
  }

  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }

  if (days === 0 && minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  }

  return parts.join(", ");
}

export function shapeKingdomDashboardData(
  source: DashboardSourceKingdom,
  now = new Date(),
): KingdomDashboardData {
  const sortedDistricts = [...source.districts].sort(
    (first, second) => getDistrictSortIndex(first.type) - getDistrictSortIndex(second.type),
  );
  const sortedBuildings = [...source.buildings].sort((first, second) => {
    const districtDifference =
      getDistrictSortIndex(first.district.type) - getDistrictSortIndex(second.district.type);

    if (districtDifference !== 0) {
      return districtDifference;
    }

    return getBuildingLabel(first.type).localeCompare(getBuildingLabel(second.type));
  });
  const sortedUnitStacks = [...source.unitStacks].sort((first, second) =>
    getUnitLabel(first.unitType).localeCompare(getUnitLabel(second.unitType)),
  );

  return {
    kingdom: {
      id: source.id,
      name: source.name,
      slug: source.slug,
      centerLat: source.centerLat,
      centerLng: source.centerLng,
      protectionEndsAt: source.protectionEndsAt,
      protectionRemaining: getProtectionRemainingText(source.protectionEndsAt, now),
      usableLandM2: source.usableLandM2,
      usedLandM2: source.usedLandM2,
      freeLandM2: calculateFreeLandM2(source.usableLandM2, source.usedLandM2),
      visibleAreaM2: source.visibleAreaM2,
      population: source.population,
    },
    resources: source.resourceStockpile ?? {
      money: 0,
      food: 0,
      manpower: 0,
      knowledge: 0,
    },
    districts: sortedDistricts.map((district) => ({
      id: district.id,
      type: district.type,
      label: getDistrictLabel(district.type),
      allocatedLandM2: district.allocatedLandM2,
      usedLandM2: district.usedLandM2,
      freeLandM2: calculateFreeLandM2(district.allocatedLandM2, district.usedLandM2),
    })),
    buildings: sortedBuildings.map((building) => ({
      id: building.id,
      type: building.type,
      label: getBuildingLabel(building.type),
      level: building.level,
      status: building.status,
      statusLabel: formatEnumLabel(building.status),
      landUsedM2: building.landUsedM2,
      districtType: building.district.type,
      districtLabel: getDistrictLabel(building.district.type),
    })),
    army: sortedUnitStacks.map((unitStack) => ({
      id: unitStack.id,
      unitType: unitStack.unitType,
      label: getUnitLabel(unitStack.unitType),
      quantity: unitStack.quantity,
      locationType: unitStack.locationType,
      locationLabel: formatEnumLabel(unitStack.locationType),
    })),
  };
}

export async function getKingdomDashboardData(
  kingdomId: string,
): Promise<KingdomDashboardData | null> {
  const kingdom = await getPrismaClient().kingdom.findUnique({
    where: { id: kingdomId },
    select: {
      id: true,
      name: true,
      slug: true,
      centerLat: true,
      centerLng: true,
      protectionEndsAt: true,
      usableLandM2: true,
      usedLandM2: true,
      visibleAreaM2: true,
      population: true,
      resourceStockpile: {
        select: {
          money: true,
          food: true,
          manpower: true,
          knowledge: true,
        },
      },
      districts: {
        select: {
          id: true,
          type: true,
          allocatedLandM2: true,
          usedLandM2: true,
        },
      },
      buildings: {
        select: {
          id: true,
          type: true,
          level: true,
          status: true,
          landUsedM2: true,
          district: {
            select: {
              type: true,
            },
          },
        },
      },
      unitStacks: {
        select: {
          id: true,
          unitType: true,
          quantity: true,
          locationType: true,
        },
      },
    },
  });

  return kingdom ? shapeKingdomDashboardData(kingdom) : null;
}
