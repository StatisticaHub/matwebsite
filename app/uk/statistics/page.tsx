import MarketStatisticsPage from "@/components/MarketStatisticsPage";
import { buildStatisticsMarketMetadata } from "@/lib/market-statistics-pages";

export const dynamic = "force-dynamic";

export const metadata =
  buildStatisticsMarketMetadata("uk");

export default function UKStatisticsPage() {
  return (
    <MarketStatisticsPage market="uk" />
  );
}
