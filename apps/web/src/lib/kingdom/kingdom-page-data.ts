import { redirect } from "next/navigation";
import { requireUserWithKingdom } from "@/lib/auth/guards";
import { isAdminUser } from "@/lib/auth/route-destinations";
import {
  getKingdomDashboardData,
  type KingdomDashboardData,
} from "@/lib/kingdom/dashboard-data";

export type KingdomPageData = {
  dashboardData: KingdomDashboardData;
  userIsAdmin: boolean;
};

export async function getKingdomPageData(): Promise<KingdomPageData> {
  const user = await requireUserWithKingdom();
  const dashboardData = await getKingdomDashboardData(user.kingdom.id);

  if (!dashboardData) {
    redirect("/create-kingdom");
  }

  return {
    dashboardData,
    userIsAdmin: isAdminUser(user),
  };
}
