import MarketDataAnalysisPage from "@/components/MarketDataAnalysisPage";
import { buildDataAnalysisMarketMetadata } from "@/lib/market-data-analysis-pages";

export const dynamic = "force-dynamic";

export const metadata =
  buildDataAnalysisMarketMetadata("uk");

export default function UKDataAnalysisPage() {
  return (
    <MarketDataAnalysisPage market="uk" />
  );
}
