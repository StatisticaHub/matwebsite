import MarketTutoringPage from "@/components/MarketTutoringPage";
import { buildMarketMetadata } from "@/lib/market-pages";

export const dynamic = "force-dynamic";

export const metadata = buildMarketMetadata("uk");

export default function UKMarketPage() {
  return (
    <MarketTutoringPage market="uk" />
  );
}
