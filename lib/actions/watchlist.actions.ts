"use server";

import {connectToDatabase} from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";
import Alert from "@/database/models/alert.model";
import { revalidatePath } from "next/cache";
import { getQuote, getCompanyProfile, getFinancials } from "@/lib/actions/finnhub.actions";
import { formatMarketCapValue, formatPrice, formatChangePercent } from "@/lib/utils";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Mongoose connection failed");

        // Find the user by email in the user collection (Better Auth)
        const user = await db.collection("user").findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) {
            return [];
        }

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        // Query the Watchlist by userId
        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();

        // Return just the symbols as strings
        return items.map((item) => String(item.symbol));
    } catch (error) {
        console.error("Error fetching watchlist symbols:", error);
        return [];
    }
}

export async function getWatchlistWithData(email: string): Promise<StockWithData[]> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Mongoose connection failed");

        const user = await db.collection("user").findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();

        const watchlistWithData = await Promise.all(
            items.map(async (item) => {
                try {
                    const [quote, profile, financials] = await Promise.all([
                        getQuote(item.symbol),
                        getCompanyProfile(item.symbol),
                        getFinancials(item.symbol),
                    ]);

                    const currentPrice = quote.c || 0;
                    const changePercent = quote.dp || 0;

                    return {
                        userId: String(item.userId),
                        symbol: String(item.symbol),
                        company: item.company || profile.name || String(item.symbol),
                        logo: profile.logo,
                        addedAt: item.addedAt,
                        currentPrice,
                        changePercent,
                        priceFormatted: formatPrice(currentPrice),
                        changeFormatted: formatChangePercent(changePercent),
                        marketCap: formatMarketCapValue(profile.marketCapitalization || 0),
                        peRatio: financials.metric?.peExclExtraTTM?.toFixed(2) || "N/A",
                    };
                } catch (e) {
                    console.error(`Error fetching data for ${item.symbol}:`, e);
                    return {
                        userId: String(item.userId),
                        symbol: String(item.symbol),
                        company: item.company,
                        addedAt: item.addedAt,
                        priceFormatted: "N/A",
                        changeFormatted: "N/A",
                        marketCap: "N/A",
                        peRatio: "N/A",
                    };
                }
            })
        );

        return watchlistWithData;
    } catch (error) {
        console.error("Error fetching watchlist with data:", error);
        return [];
    }
}

export async function toggleWatchlist(email: string, symbol: string, company: string): Promise<{ success: boolean; error?: string }> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Mongoose connection failed");

        const user = await db.collection("user").findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
        if (!user) throw new Error("User not found");

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) throw new Error("User ID not found");

        const upperSymbol = symbol.toUpperCase();

        const existing = await Watchlist.findOne({ userId, symbol: upperSymbol });

        if (existing) {
            await Promise.all([
                Watchlist.deleteOne({ _id: existing._id }),
                Alert.deleteMany({ userId, symbol: upperSymbol })
            ]);
        } else {
            await Watchlist.create({
                userId,
                symbol: upperSymbol,
                company,
            });
        }

        revalidatePath(`/stocks/${upperSymbol}`);
        revalidatePath("/watchlist");
        return { success: true };
    } catch (error) {
        console.error("Error toggling watchlist:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to toggle watchlist" };
    }
}
