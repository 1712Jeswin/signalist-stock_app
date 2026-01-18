"use server";

import { connectToDatabase } from "@/database/mongoose";
import Alert from "@/database/models/alert.model";
import { revalidatePath } from "next/cache";

export async function createAlert(email: string, data: {
    symbol: string;
    company: string;
    logoUrl?: string;
    condition: 'greater' | 'less' | 'equal';
    targetPrice: number;
    frequency: 'once' | 'daily';
}) {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Mongoose connection failed");

        const user = await db.collection("user").findOne({ email });
        if (!user) throw new Error("User not found");

        const userId = (user.id as string) || String(user._id || '');
        
        await Alert.create({
            userId,
            ...data
        });

        revalidatePath("/watchlist");
        return { success: true };
    } catch (error) {
        console.error("Error creating alert:", error);
        return { success: false, error: "Failed to create alert" };
    }
}

export async function getAlertsByEmail(email: string): Promise<Alert[]> {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error("Mongoose connection failed");

        const user = await db.collection("user").findOne({ email });
        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        
        const alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).lean();
        
        return JSON.parse(JSON.stringify(alerts)) as Alert[];
    } catch (error) {
        console.error("Error fetching alerts:", error);
        return [];
    }
}

export async function deleteAlert(alertId: string) {
    try {
        await connectToDatabase();
        await Alert.findByIdAndDelete(alertId);
        revalidatePath("/watchlist");
        return { success: true };
    } catch (error) {
        console.error("Error deleting alert:", error);
        return { success: false, error: "Failed to delete alert" };
    }
}

export async function toggleAlertStatus(alertId: string, isActive: boolean) {
    try {
        await connectToDatabase();
        await Alert.findByIdAndUpdate(alertId, { isActive });
        revalidatePath("/watchlist");
        return { success: true };
    } catch (error) {
        console.error("Error toggling alert status:", error);
        return { success: false, error: "Failed to update alert" };
    }
}
