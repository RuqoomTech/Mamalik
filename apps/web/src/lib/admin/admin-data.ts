import { getPrismaClient } from "@/lib/db/client";
import { calculateFreeLandM2 } from "@/lib/kingdom/dashboard-data";

export const ADMIN_TABLE_LIMIT = 50;
export const ADMIN_DETAIL_TABLE_LIMIT = 100;
export const ADMIN_REPORT_PREVIEW_LIMIT = 20;

export type AdminUserRow = {
  email: string;
  displayName: string;
  role: string;
  roleLabel: string;
  authProvider: string;
  authProviderLabel: string;
  createdAt: Date;
  hasKingdom: boolean;
};

export type AdminKingdomRow = {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerDisplayName: string;
  centerLat: number;
  centerLng: number;
  usableLandM2: number;
  usedLandM2: number;
  freeLandM2: number;
  population: number;
  protectionEndsAt: Date;
  createdAt: Date;
};

export type AdminResourceRow = {
  kingdomName: string;
  money: number | null;
  food: number | null;
  manpower: number | null;
  knowledge: number | null;
};

export type AdminDistrictRow = {
  kingdomName: string;
  type: string;
  typeLabel: string;
  allocatedLandM2: number;
  usedLandM2: number;
  freeLandM2: number;
};

export type AdminBuildingRow = {
  kingdomName: string;
  type: string;
  typeLabel: string;
  level: number;
  status: string;
  statusLabel: string;
  landUsedM2: number;
  districtType: string;
  districtLabel: string;
};

export type AdminUnitRow = {
  kingdomName: string;
  unitType: string;
  unitLabel: string;
  quantity: number;
  locationType: string;
  locationLabel: string;
};

export type AdminReportRow = {
  type: string;
  typeLabel: string;
  title: string;
  kingdomName: string;
  createdAt: Date;
  readState: "Read" | "Unread";
};

export type AdminOverviewData = {
  counts: {
    users: number;
    kingdoms: number;
    reports: number;
  };
  users: AdminUserRow[];
  kingdoms: AdminKingdomRow[];
  resources: AdminResourceRow[];
  districts: AdminDistrictRow[];
  buildings: AdminBuildingRow[];
  units: AdminUnitRow[];
  reports: AdminReportRow[];
};

export type AdminDistrictSource = {
  type: string;
  allocatedLandM2: number;
  usedLandM2: number;
  kingdom: {
    name: string;
  };
};

export type AdminBuildingSource = {
  type: string;
  level: number;
  status: string;
  landUsedM2: number;
  kingdom: {
    name: string;
  };
  district: {
    type: string;
  };
};

export type AdminUnitSource = {
  unitType: string;
  quantity: number;
  locationType: string;
  kingdom: {
    name: string;
  };
};

export type AdminReportSource = {
  type: string;
  title: string;
  readAt: Date | null;
  createdAt: Date;
  kingdom: {
    name: string;
  };
};

export function formatAdminEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function getAdminReportReadState(readAt: Date | null): "Read" | "Unread" {
  return readAt ? "Read" : "Unread";
}

export function shapeAdminDistrictRow(source: AdminDistrictSource): AdminDistrictRow {
  return {
    kingdomName: source.kingdom.name,
    type: source.type,
    typeLabel: formatAdminEnumLabel(source.type),
    allocatedLandM2: source.allocatedLandM2,
    usedLandM2: source.usedLandM2,
    freeLandM2: calculateFreeLandM2(source.allocatedLandM2, source.usedLandM2),
  };
}

export function shapeAdminBuildingRow(source: AdminBuildingSource): AdminBuildingRow {
  return {
    kingdomName: source.kingdom.name,
    type: source.type,
    typeLabel: formatAdminEnumLabel(source.type),
    level: source.level,
    status: source.status,
    statusLabel: formatAdminEnumLabel(source.status),
    landUsedM2: source.landUsedM2,
    districtType: source.district.type,
    districtLabel: formatAdminEnumLabel(source.district.type),
  };
}

export function shapeAdminUnitRow(source: AdminUnitSource): AdminUnitRow {
  return {
    kingdomName: source.kingdom.name,
    unitType: source.unitType,
    unitLabel: formatAdminEnumLabel(source.unitType),
    quantity: source.quantity,
    locationType: source.locationType,
    locationLabel: formatAdminEnumLabel(source.locationType),
  };
}

export function shapeAdminReportRow(source: AdminReportSource): AdminReportRow {
  return {
    type: source.type,
    typeLabel: formatAdminEnumLabel(source.type),
    title: source.title,
    kingdomName: source.kingdom.name,
    createdAt: source.createdAt,
    readState: getAdminReportReadState(source.readAt),
  };
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const prisma = getPrismaClient();
  const [
    usersCount,
    kingdomsCount,
    reportsCount,
    users,
    kingdoms,
    resourceKingdoms,
    districts,
    buildings,
    units,
    reports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.kingdom.count(),
    prisma.report.count(),
    prisma.user.findMany({
      take: ADMIN_TABLE_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        email: true,
        displayName: true,
        role: true,
        authProvider: true,
        createdAt: true,
        kingdom: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.kingdom.findMany({
      take: ADMIN_TABLE_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        slug: true,
        centerLat: true,
        centerLng: true,
        usableLandM2: true,
        usedLandM2: true,
        population: true,
        protectionEndsAt: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.kingdom.findMany({
      take: ADMIN_TABLE_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        resourceStockpile: {
          select: {
            money: true,
            food: true,
            manpower: true,
            knowledge: true,
          },
        },
      },
    }),
    prisma.district.findMany({
      take: ADMIN_DETAIL_TABLE_LIMIT,
      orderBy: [{ kingdom: { createdAt: "desc" } }, { type: "asc" }],
      select: {
        type: true,
        allocatedLandM2: true,
        usedLandM2: true,
        kingdom: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.buildingInstance.findMany({
      take: ADMIN_DETAIL_TABLE_LIMIT,
      orderBy: [{ kingdom: { createdAt: "desc" } }, { type: "asc" }],
      select: {
        type: true,
        level: true,
        status: true,
        landUsedM2: true,
        kingdom: {
          select: {
            name: true,
          },
        },
        district: {
          select: {
            type: true,
          },
        },
      },
    }),
    prisma.unitStack.findMany({
      take: ADMIN_DETAIL_TABLE_LIMIT,
      orderBy: [{ kingdom: { createdAt: "desc" } }, { unitType: "asc" }],
      select: {
        unitType: true,
        quantity: true,
        locationType: true,
        kingdom: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      take: ADMIN_REPORT_PREVIEW_LIMIT,
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        title: true,
        readAt: true,
        createdAt: true,
        kingdom: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    counts: {
      users: usersCount,
      kingdoms: kingdomsCount,
      reports: reportsCount,
    },
    users: users.map((user) => ({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      roleLabel: formatAdminEnumLabel(user.role),
      authProvider: user.authProvider,
      authProviderLabel: formatAdminEnumLabel(user.authProvider),
      createdAt: user.createdAt,
      hasKingdom: Boolean(user.kingdom),
    })),
    kingdoms: kingdoms.map((kingdom) => ({
      name: kingdom.name,
      slug: kingdom.slug,
      ownerEmail: kingdom.user.email,
      ownerDisplayName: kingdom.user.displayName,
      centerLat: kingdom.centerLat,
      centerLng: kingdom.centerLng,
      usableLandM2: kingdom.usableLandM2,
      usedLandM2: kingdom.usedLandM2,
      freeLandM2: calculateFreeLandM2(kingdom.usableLandM2, kingdom.usedLandM2),
      population: kingdom.population,
      protectionEndsAt: kingdom.protectionEndsAt,
      createdAt: kingdom.createdAt,
    })),
    resources: resourceKingdoms.map((kingdom) => ({
      kingdomName: kingdom.name,
      money: kingdom.resourceStockpile?.money ?? null,
      food: kingdom.resourceStockpile?.food ?? null,
      manpower: kingdom.resourceStockpile?.manpower ?? null,
      knowledge: kingdom.resourceStockpile?.knowledge ?? null,
    })),
    districts: districts.map(shapeAdminDistrictRow),
    buildings: buildings.map(shapeAdminBuildingRow),
    units: units.map(shapeAdminUnitRow),
    reports: reports.map(shapeAdminReportRow),
  };
}
