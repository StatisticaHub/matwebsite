import MarketTutoringPage from "@/components/MarketTutoringPage";
import { buildMarketMetadata } from "@/lib/market-pages";

export const dynamic = "force-dynamic";

export const metadata = buildMarketMetadata("ca");

export default function CanadaMarketPage() {
  return (
    <MarketTutoringPage market="ca" />
  );
}
