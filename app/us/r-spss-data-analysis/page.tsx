import MarketDataAnalysisPage from "@/components/MarketDataAnalysisPage";
import { buildDataAnalysisMarketMetadata } from "@/lib/market-data-analysis-pages";

export const dynamic = "force-dynamic";

export const metadata =
  buildDataAnalysisMarketMetadata("us");

export default function USDataAnalysisPage() {
  return (
    <MarketDataAnalysisPage market="us" />
  );
}
