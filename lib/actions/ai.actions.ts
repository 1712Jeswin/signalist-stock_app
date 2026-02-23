'use server';

import { connectToDatabase } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";
import { getCurrentPrice, getStockPriceHistory, getNews } from "@/lib/actions/finnhub.actions";
import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";

export async function processPinnedStocksData() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        
        if (!userId) {
            return { error: 'Unauthorized' }
        }

        await connectToDatabase();
        
        // Fetch pinned stocks for this user
        const pinnedStocks = await Watchlist.find({
            userId,
            pinned: true
        }).lean();

        if (!pinnedStocks || pinnedStocks.length === 0) {
            return { error: 'No pinned stocks found' }
        }

        const now = new Date();
        const nowUnix = Math.floor(now.getTime() / 1000);
        const sevenDaysAgoUnix = nowUnix - (7 * 24 * 60 * 60);
        const thirtyDaysAgoUnix = nowUnix - (30 * 24 * 60 * 60);

        const stockDataPromises = pinnedStocks.map(async (stock) => {
            const symbol = stock.symbol;
            const pinnedAt = stock.pinnedAt ? new Date(stock.pinnedAt) : now;
            const pinnedAtUnix = Math.floor(pinnedAt.getTime() / 1000);

            // Fetch News
            // We use the same getNews function which fetches latest company news if symbol is provided
            const newsArticles = await getNews([symbol]);
            const recentNews = (newsArticles || []).slice(0, 3).map(n => ({
                headline: n.headline,
                summary: n.summary,
                url: n.url
            }));

            // Fetch Current Price
            const currentPrice = await getCurrentPrice(symbol);

            // Fetch Historical Prices (we get the array, pick the first valid element for simplicity)
            const hist7D = await getStockPriceHistory(symbol, sevenDaysAgoUnix, nowUnix);
            const hist30D = await getStockPriceHistory(symbol, thirtyDaysAgoUnix, nowUnix);
            
            // For since pinned, we fetch from pinnedAtUnix to now
            const histPinned = await getStockPriceHistory(symbol, pinnedAtUnix, nowUnix);

            const price7DAgo = hist7D?.c?.[0] || null;
            const price30DAgo = hist30D?.c?.[0] || null;
            const pricePinnedAt = histPinned?.c?.[0] || null;

            return {
                symbol,
                company: stock.company,
                pinnedAt: pinnedAt.toISOString(),
                currentPrice,
                price7DAgo,
                price30DAgo,
                pricePinnedAt,
                recentNews
            };
        });

        const data = await Promise.all(stockDataPromises);
        return { data };

    } catch (e) {
        console.error('Error processing pinned stocks:', e);
        return { error: 'Internal Server Error' }
    }
}

export async function processWatchlistStocksData() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        
        if (!userId) {
            return { error: 'Unauthorized' }
        }

        await connectToDatabase();
        
        // Fetch ALL watchlisted stocks for this user
        const watchlistStocks = await Watchlist.find({
            userId
        }).lean();

        if (!watchlistStocks || watchlistStocks.length === 0) {
            return { error: 'No stocks found in your watchlist' }
        }

        const now = new Date();
        const nowUnix = Math.floor(now.getTime() / 1000);
        const sevenDaysAgoUnix = nowUnix - (7 * 24 * 60 * 60);
        const thirtyDaysAgoUnix = nowUnix - (30 * 24 * 60 * 60);

        const stockDataPromises = watchlistStocks.map(async (stock) => {
            const symbol = stock.symbol;

            // Fetch News
            const newsArticles = await getNews([symbol]);
            const recentNews = (newsArticles || []).slice(0, 3).map(n => ({
                headline: n.headline,
                summary: n.summary
            }));

            // Fetch Current Price
            const currentPrice = await getCurrentPrice(symbol);

            // Fetch Historical Prices
            const hist7D = await getStockPriceHistory(symbol, sevenDaysAgoUnix, nowUnix);
            const hist30D = await getStockPriceHistory(symbol, thirtyDaysAgoUnix, nowUnix);

            const price7DAgo = hist7D?.c?.[0] || null;
            const price30DAgo = hist30D?.c?.[0] || null;

            return {
                symbol,
                company: stock.company,
                pinned: stock.pinned,
                currentPrice,
                price7DAgo,
                price30DAgo,
                recentNews
            };
        });

        const data = await Promise.all(stockDataPromises);
        return { data };

    } catch (e) {
        console.error('Error processing watchlist stocks:', e);
        return { error: 'Internal Server Error' }
    }
}
