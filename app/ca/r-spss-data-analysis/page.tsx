import MarketDataAnalysisPage from "@/components/MarketDataAnalysisPage";
import { buildDataAnalysisMarketMetadata } from "@/lib/market-data-analysis-pages";

export const dynamic = "force-dynamic";

export const metadata =
  buildDataAnalysisMarketMetadata("ca");

export default function CanadaDataAnalysisPage() {
  return (
    <MarketDataAnalysisPage market="ca" />
  );
}
