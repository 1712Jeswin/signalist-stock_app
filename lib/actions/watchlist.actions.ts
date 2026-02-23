"use server";

import {connectToDatabase} from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Mongoose connection failed");

        // Find the user by email in the user collection (Better Auth)
        const user = await db.collection("user").findOne<{ _id?: unknown; id?: string; email?: string }>({email});

        if (!user) {
            return [];
        }

        const userId = (user.id as string) || String(user._id || '');
        if(!userId) return [];

        // Query the Watchlist by userId
        const items = await Watchlist.find({userId}, {symbol: 1}).lean();

        // Return just the symbols as strings
        return items.map((item) => String(item.symbol));
    } catch (error) {
        console.error("Error fetching watchlist symbols:", error);
        return [];
    }
}
