import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

const StockDetails = async ({ params }: StockDetailsPageProps) => {
    const { symbol } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const userEmail = session?.user?.email;

    let isInWatchlist = false;
    if (userEmail) {
        const watchlistSymbols = await getWatchlistSymbolsByEmail(userEmail);
        isInWatchlist = watchlistSymbols.includes(symbol.toUpperCase());
    }

    const searchResults = await searchStocks(symbol);
    const stockInfo = searchResults.find(s => s.symbol === symbol.toUpperCase());
    const companyName = stockInfo?.name || symbol;

    const scriptUrl = "https://s3.tradingview.com/external-embedding/embed-widget-";

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="flex flex-col gap-8">
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}symbol-info.js`}
                    config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                    height={170}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                    height={600}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={BASELINE_WIDGET_CONFIG(symbol)}
                    height={600}
                />
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-8">
                <WatchlistButton
                    symbol={symbol}
                    company={companyName}
                    isInWatchlist={isInWatchlist}
                    userEmail={userEmail}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}technical-analysis.js`}
                    config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                    height={400}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}symbol-profile.js`}
                    config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                    height={440}
                />
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}financials.js`}
                    config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                    height={464}
                />
            </div>
        </div>
    );
};

export default StockDetails;
