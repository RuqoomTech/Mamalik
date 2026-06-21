import {
  calculateFoodConsumption,
  calculateResourceGeneration,
  formatTicksAsDuration,
  getResourceGenerationTotals,
  STARTER_BUILDINGS,
  STARTER_UNITS,
  STARTING_DISTRICTS,
  type BuildingStatusLike,
  type BuildingTypeLike,
  type UnitTypeLike,
} from "@mamalik/game";
import { getPrismaClient } from "@/lib/db/client";

export const DASHBOARD_STATUS_NOTE =
  "Land buying, scouting, combat, alliances, rankings, and player-facing start actions are coming in later v0.1 work.";

const LOW_FOOD_TICK_THRESHOLD = 6;

type JsonObject = { [key: string]: unknown };

export type DashboardSourceTickLog = {
  tickKey: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  processedKingdomCount: number;
  errorMessage: string | null;
};

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
    constructionRemainingTicks: number;
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
  trainingQueueItems?: Array<{
    id: string;
    unitType: string;
    quantity: number;
    remainingTicks: number;
    status: string;
    createdAt: Date;
  }>;
  reports?: Array<{
    id: string;
    type: string;
    title: string;
    bodyJson: unknown;
    readAt: Date | null;
    createdAt: Date;
  }>;
};

export type FoodStatusLevel = "healthy" | "warning" | "shortage";

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
  economyEstimate: {
    money: {
      populationTax: number;
      marketBonus: number;
      taxOfficeBonus: number;
      palaceBonus: number;
      total: number;
    };
    food: {
      farmProduction: number;
      generatedTotal: number;
      populationConsumption: number;
      armyConsumption: number;
      consumedTotal: number;
      net: number;
    };
    manpower: {
      populationManpowerGrowth: number;
      housesBonus: number;
      total: number;
    };
    knowledge: {
      scholarHallProduction: number;
      total: number;
    };
  };
  foodStatus: {
    level: FoodStatusLevel;
    label: string;
    detail: string;
    ticksUntilEmpty: number | null;
    estimatedTimeUntilEmpty: string | null;
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
    constructionRemainingTicks: number;
    districtType: string;
    districtLabel: string;
  }>;
  activeConstruction: Array<{
    id: string;
    type: string;
    label: string;
    level: number;
    status: string;
    statusLabel: string;
    remainingTicks: number;
    estimatedTimeRemaining: string;
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
  trainingQueues: Array<{
    id: string;
    unitType: string;
    label: string;
    quantity: number;
    remainingTicks: number;
    estimatedTimeRemaining: string;
    status: string;
    statusLabel: string;
  }>;
  latestTicks: Array<{
    tickKey: string;
    status: string;
    statusLabel: string;
    processedKingdomCount: number;
    startedAt: Date;
    finishedAt: Date | null;
    errorMessage: string | null;
  }>;
  reports: Array<{
    id: string;
    type: string;
    typeLabel: string;
    title: string;
    bodySummary: string | null;
    read: boolean;
    createdAt: Date;
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

export function calculateNetFoodPerTick(generatedFood: number, consumedFood: number): number {
  return generatedFood - consumedFood;
}

export function calculateTicksUntilFoodEmpty(
  currentFood: number,
  netFoodPerTick: number,
): number | null {
  if (currentFood <= 0) {
    return 0;
  }

  if (netFoodPerTick >= 0) {
    return null;
  }

  return Math.ceil(currentFood / Math.abs(netFoodPerTick));
}

export function getFoodStatus(
  currentFood: number,
  netFoodPerTick: number,
): KingdomDashboardData["foodStatus"] {
  const ticksUntilEmpty = calculateTicksUntilFoodEmpty(currentFood, netFoodPerTick);

  if (currentFood <= 0) {
    return {
      level: "shortage",
      label: "Shortage",
      detail: "Food is empty. Sprint 2 currently clamps Food at zero without starvation penalties.",
      ticksUntilEmpty: 0,
      estimatedTimeUntilEmpty: "~0 minutes",
    };
  }

  if (ticksUntilEmpty !== null) {
    const estimatedTimeUntilEmpty = formatTicksAsDuration(ticksUntilEmpty);

    if (ticksUntilEmpty <= LOW_FOOD_TICK_THRESHOLD) {
      return {
        level: "warning",
        label: "Low Food",
        detail: `Food will reach zero in about ${ticksUntilEmpty} tick${ticksUntilEmpty === 1 ? "" : "s"} (${estimatedTimeUntilEmpty}).`,
        ticksUntilEmpty,
        estimatedTimeUntilEmpty,
      };
    }

    return {
      level: "healthy",
      label: "Reserve stable",
      detail: `Food is decreasing but should last about ${ticksUntilEmpty} ticks (${estimatedTimeUntilEmpty}).`,
      ticksUntilEmpty,
      estimatedTimeUntilEmpty,
    };
  }

  if (netFoodPerTick > 0) {
    return {
      level: "healthy",
      label: "Increasing",
      detail: `Food is increasing by ${netFoodPerTick} per tick.`,
      ticksUntilEmpty: null,
      estimatedTimeUntilEmpty: null,
    };
  }

  return {
    level: "healthy",
    label: "Stable",
    detail: "Food is stable at the current per-tick balance.",
    ticksUntilEmpty: null,
    estimatedTimeUntilEmpty: null,
  };
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function formatReportKey(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
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
  latestTickLogs: DashboardSourceTickLog[] = [],
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
  const sortedTrainingQueues = [...(source.trainingQueueItems ?? [])].sort(
    (first, second) => first.createdAt.getTime() - second.createdAt.getTime(),
  );
  const sortedReports = [...(source.reports ?? [])].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  );
  const generationBreakdown = calculateResourceGeneration({
    population: source.population,
    buildings: source.buildings.map((building) => ({
      type: building.type as BuildingTypeLike,
      level: building.level,
      status: building.status as BuildingStatusLike,
    })),
  });
  const generationTotals = getResourceGenerationTotals(generationBreakdown);
  const consumption = calculateFoodConsumption({
    population: source.population,
    units: source.unitStacks.map((unitStack) => ({
      unitType: unitStack.unitType as UnitTypeLike,
      quantity: unitStack.quantity,
    })),
  });
  const resources = source.resourceStockpile ?? {
    money: 0,
    food: 0,
    manpower: 0,
    knowledge: 0,
  };
  const netFoodPerTick = calculateNetFoodPerTick(
    generationTotals.food,
    consumption.totalFoodConsumption,
  );
  const shapedBuildings = sortedBuildings.map((building) => ({
    id: building.id,
    type: building.type,
    label: getBuildingLabel(building.type),
    level: building.level,
    status: building.status,
    statusLabel: formatEnumLabel(building.status),
    landUsedM2: building.landUsedM2,
    constructionRemainingTicks: building.constructionRemainingTicks,
    districtType: building.district.type,
    districtLabel: getDistrictLabel(building.district.type),
  }));

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
    resources,
    economyEstimate: {
      money: generationBreakdown.money,
      food: {
        farmProduction: generationBreakdown.food.farmProduction,
        generatedTotal: generationTotals.food,
        populationConsumption: consumption.populationFoodConsumption,
        armyConsumption: consumption.armyFoodConsumption,
        consumedTotal: consumption.totalFoodConsumption,
        net: netFoodPerTick,
      },
      manpower: generationBreakdown.manpower,
      knowledge: generationBreakdown.knowledge,
    },
    foodStatus: getFoodStatus(resources.food, netFoodPerTick),
    districts: sortedDistricts.map((district) => ({
      id: district.id,
      type: district.type,
      label: getDistrictLabel(district.type),
      allocatedLandM2: district.allocatedLandM2,
      usedLandM2: district.usedLandM2,
      freeLandM2: calculateFreeLandM2(district.allocatedLandM2, district.usedLandM2),
    })),
    buildings: shapedBuildings,
    activeConstruction: shapedBuildings
      .filter((building) => building.status === "CONSTRUCTING" || building.status === "UPGRADING")
      .map((building) => ({
        id: building.id,
        type: building.type,
        label: building.label,
        level: building.level,
        status: building.status,
        statusLabel: building.statusLabel,
        remainingTicks: building.constructionRemainingTicks,
        estimatedTimeRemaining: formatTicksAsDuration(building.constructionRemainingTicks),
        districtLabel: building.districtLabel,
      })),
    army: sortedUnitStacks.map((unitStack) => ({
      id: unitStack.id,
      unitType: unitStack.unitType,
      label: getUnitLabel(unitStack.unitType),
      quantity: unitStack.quantity,
      locationType: unitStack.locationType,
      locationLabel: formatEnumLabel(unitStack.locationType),
    })),
    trainingQueues: sortedTrainingQueues.map((trainingQueue) => ({
      id: trainingQueue.id,
      unitType: trainingQueue.unitType,
      label: getUnitLabel(trainingQueue.unitType),
      quantity: trainingQueue.quantity,
      remainingTicks: trainingQueue.remainingTicks,
      estimatedTimeRemaining: formatTicksAsDuration(trainingQueue.remainingTicks),
      status: trainingQueue.status,
      statusLabel: formatEnumLabel(trainingQueue.status),
    })),
    latestTicks: latestTickLogs.map((tickLog) => ({
      tickKey: tickLog.tickKey,
      status: tickLog.status,
      statusLabel: formatEnumLabel(tickLog.status),
      processedKingdomCount: tickLog.processedKingdomCount,
      startedAt: tickLog.startedAt,
      finishedAt: tickLog.finishedAt,
      errorMessage: tickLog.errorMessage,
    })),
    reports: sortedReports.map((report) => ({
      id: report.id,
      type: report.type,
      typeLabel: formatEnumLabel(report.type),
      title: report.title,
      bodySummary: summarizeReportBody(report.bodyJson),
      read: report.readAt !== null,
      createdAt: report.createdAt,
    })),
  };
}

export async function getKingdomDashboardData(
  kingdomId: string,
): Promise<KingdomDashboardData | null> {
  const prisma = getPrismaClient();
  const [kingdom, latestTickLogs] = await Promise.all([
    prisma.kingdom.findUnique({
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
            constructionRemainingTicks: true,
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
        trainingQueueItems: {
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            unitType: true,
            quantity: true,
            remainingTicks: true,
            status: true,
            createdAt: true,
          },
        },
        reports: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            type: true,
            title: true,
            bodyJson: true,
            readAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.$queryRaw<DashboardSourceTickLog[]>`
      SELECT
        "tickKey",
        "status"::text AS "status",
        "startedAt",
        "finishedAt",
        "processedKingdomCount",
        "errorMessage"
      FROM "TickLog"
      ORDER BY "startedAt" DESC
      LIMIT 5
    `,
  ]);

  return kingdom ? shapeKingdomDashboardData(kingdom, new Date(), latestTickLogs) : null;
}

function summarizeReportBody(bodyJson: unknown): string | null {
  if (!isJsonObject(bodyJson)) {
    if (
      bodyJson === null ||
      Array.isArray(bodyJson) ||
      (typeof bodyJson !== "string" &&
        typeof bodyJson !== "number" &&
        typeof bodyJson !== "boolean")
    ) {
      return null;
    }

    return truncateText(String(bodyJson));
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(bodyJson)) {
    if (
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      continue;
    }

    parts.push(`${formatReportKey(key)}: ${formatReportValue(value)}`);
  }

  return parts.length > 0 ? truncateText(parts.slice(0, 4).join(" - ")) : null;
}

function formatReportValue(value: string | number | boolean): string {
  if (typeof value === "string") {
    return /^[A-Z_]+$/.test(value) ? formatEnumLabel(value) : value;
  }

  return String(value);
}

function truncateText(value: string, maxLength = 140): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
