'use server';

import { connectToDatabase } from '@/database/mongoose';
import AlertRecord from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createAlert(symbol: string, targetPrice: number, condition: 'greater_than' | 'less_than') {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        if (!userId) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        
        // Ensure no duplicate active alert for the exact same condition & price exists to prevent spam
        const existing = await AlertRecord.findOne({
            userId,
            symbol: symbol.toUpperCase(),
            targetPrice,
            condition,
            isActive: true
        });

        if (existing) {
             return { error: 'An identical active alert already exists for this stock.' };
        }

        const newAlert = new AlertRecord({
            userId,
            symbol: symbol.toUpperCase(),
            targetPrice,
            condition,
            isActive: true
        });

        await newAlert.save();
        revalidatePath('/watchlist');
        
        return { success: true, data: JSON.parse(JSON.stringify(newAlert)) };
    } catch (e: any) {
         console.error('Error creating alert:', e);
         return { error: 'Failed to create price alert.' };
    }
}

export async function getUserActiveAlerts() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        if (!userId) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        
        const alerts = await AlertRecord.find({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
        
        return { success: true, data: JSON.parse(JSON.stringify(alerts)) };
    } catch (e: any) {
         console.error('Error fetching alerts:', e);
         return { error: 'Failed to fetch active alerts.' };
    }
}

export async function deleteAlert(alertId: string) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        if (!userId) {
            return { error: 'Unauthorized' };
        }

        await connectToDatabase();
        
        await AlertRecord.findOneAndDelete({ _id: alertId, userId });
        
        revalidatePath('/watchlist');
        return { success: true };
    } catch (e: any) {
         console.error('Error deleting alert:', e);
         return { error: 'Failed to delete alert.' };
    }
}
