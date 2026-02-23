'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';
import AlertRecord from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentPrice } from '@/lib/actions/finnhub.actions';

export async function togglePinStock(symbol: string, currentPinnedState: boolean) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        if (!userId) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        
        await Watchlist.findOneAndUpdate(
            { userId, symbol: symbol.toUpperCase() },
            { 
                $set: { 
                    pinned: !currentPinnedState,
                    pinnedAt: !currentPinnedState ? new Date() : null
                } 
            }
        );

        revalidatePath('/watchlist');
        return { success: true };
    } catch (e: any) {
         console.error('Error toggling pin:', e);
         return { error: 'Failed to update pin status' };
    }
}

export async function getWatchlistWithPrices() {
   try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        if (!userId) return { error: 'Unauthorized' };

        await connectToDatabase();
        
        const items = await Watchlist.find({ userId }).sort({ pinned: -1, addedAt:-1 }).lean();
        
        const watchlist = items.map(i => ({
            symbol: i.symbol,
            company: i.company,
            pinned: i.pinned || false,
            pinnedAt: i.pinnedAt ? i.pinnedAt.toISOString() : null
        }));

        // Fetch prices for pinned stocks
        const prices: Record<string, number> = {};
        const pinnedSymbols = watchlist.filter(i => i.pinned).map(i => i.symbol);
        
        await Promise.all(pinnedSymbols.map(async (sym) => {
            const price = await getCurrentPrice(sym);
            if (price !== null) {
                prices[sym] = price;
            }
        }));

        // Fetch active alerts for this user
        const activeAlerts = await AlertRecord.find({ userId, isActive: true }).lean();
        const alerts: Record<string, any[]> = {};
        
        activeAlerts.forEach((alert) => {
             if(!alerts[alert.symbol]) {
                 alerts[alert.symbol] = [];
             }
             alerts[alert.symbol].push({
                 _id: alert._id.toString(),
                 targetPrice: alert.targetPrice,
                 condition: alert.condition
             });
        });
        
        return { data: { watchlist, prices, alerts } };
    } catch(e) {
       console.error('Error fetching watchlist:', e);
       return { error: 'Failed to fetch watchlist' };
   }
}

export async function toggleWatchlist(symbol: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        if (!userId) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        
        const existing = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() });
        if (existing) {
             await Watchlist.deleteOne({ _id: existing._id });
             revalidatePath('/watchlist');
             revalidatePath(`/stocks/${symbol}`);
             return { success: true, isWatchlisted: false };
        } else {
             await Watchlist.create({
                 userId,
                 symbol: symbol.toUpperCase(),
                 company: symbol.toUpperCase(),
                 addedAt: new Date(),
                 pinned: false
             });
             revalidatePath('/watchlist');
             revalidatePath(`/stocks/${symbol}`);
             return { success: true, isWatchlisted: true };
        }
    } catch (e: unknown) {
         console.error('Error toggling watchlist:', e);
         return { error: 'Failed to update watchlist status' };
    }
}

export async function checkWatchlistStatus(symbol: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        if (!userId) return { isWatchlisted: false };

        await connectToDatabase();
        const existing = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() });
        return { isWatchlisted: !!existing };
    } catch (e) {
        return { isWatchlisted: false };
    }
}
