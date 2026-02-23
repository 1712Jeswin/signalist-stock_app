import React from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import AddToWatchlistButton from '@/components/AddToWatchlistButton';
import { checkWatchlistStatus } from '@/lib/actions/watchlist.actions.server';
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
    DEFAULT_HEIGHT
} from '@/lib/constants';

interface StockPageProps {
    params: Promise<{ symbol: string }>;
}

export default async function StockDetailsPage({ params }: StockPageProps) {
    const { symbol } = await params;
    const decodedSymbol = decodeURIComponent(symbol);
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    const { isWatchlisted } = await checkWatchlistStatus(decodedSymbol);

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Stock Details: {decodedSymbol.toUpperCase()}</h1>
                <AddToWatchlistButton symbol={decodedSymbol} initialIsWatchlisted={isWatchlisted} />
            </div>
            
            <section className="grid w-full gap-8 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}symbol-info.js`}
                    config={SYMBOL_INFO_WIDGET_CONFIG(decodedSymbol)}
                    height={170}
                />
            </section>

            <section className="grid w-full gap-8 border border-slate-800 rounded-xl overflow-hidden bg-[#141414]">
                <TradingViewWidget
                    scriptUrl={`${scriptUrl}advanced-chart.js`}
                    config={CANDLE_CHART_WIDGET_CONFIG(decodedSymbol)}
                    height={DEFAULT_HEIGHT}
                />
            </section>

            <section className="grid w-full lg:grid-cols-2 gap-8">
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#141414]">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}symbol-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(decodedSymbol)}
                        height={440}
                    />
                </div>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#141414]">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(decodedSymbol)}
                        height={460}
                    />
                </div>
            </section>
        </div>
    );
}
