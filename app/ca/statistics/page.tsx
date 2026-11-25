import MarketStatisticsPage from "@/components/MarketStatisticsPage";
import { buildStatisticsMarketMetadata } from "@/lib/market-statistics-pages";

export const dynamic = "force-dynamic";

export const metadata =
  buildStatisticsMarketMetadata("ca");

export default function CanadaStatisticsPage() {
  return (
    <MarketStatisticsPage market="ca" />
  );
}
