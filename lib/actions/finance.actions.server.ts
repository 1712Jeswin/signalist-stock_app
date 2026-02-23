'use server';

import { connectToDatabase } from "@/database/mongoose";
import FinanceRecord from "@/database/models/finance.model";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FINANCE_INSIGHTS_PROMPT } from "@/lib/prompts.ai";

export async function getFinanceRecord(month: string) {
    try {
        await connectToDatabase();
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) throw new Error("Unauthorized");

        const userId = session.user.id;

        let record = await FinanceRecord.findOne({ userId, month });
        
        if (!record) {
            // Initialize empty record for the month if it doesn't exist
            record = await FinanceRecord.create({
                userId,
                month,
                incomes: [],
                expenses: [],
                savingsGoal: { planned: 0, actual: 0 }
            });
        }

        return JSON.parse(JSON.stringify(record));
    } catch (error) {
        console.error("Error fetching finance record:", error);
        throw new Error("Failed to fetch finance record");
    }
}

export async function updateFinanceRecord(month: string, data: any) {
    try {
        await connectToDatabase();
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) throw new Error("Unauthorized");

        const userId = session.user.id;

        const updatedRecord = await FinanceRecord.findOneAndUpdate(
            { userId, month },
            {
                $set: {
                    incomes: data.incomes,
                    expenses: data.expenses,
                    savingsGoal: data.savingsGoal,
                }
            },
            { new: true, upsert: true }
        );

        return JSON.parse(JSON.stringify(updatedRecord));
    } catch (error) {
        console.error("Error updating finance record:", error);
        throw new Error("Failed to update finance record");
    }
}

export async function generateFinanceInsights(month: string) {
     try {
        const record = await getFinanceRecord(month);
        if (!record) throw new Error("No record found for insights");

        // Format data to string to pass to AI
        const contextData = JSON.stringify({
            month: record.month,
            incomes: record.incomes.map((i: any) => ({ source: i.source, planned: i.planned, actual: i.actual })),
            expenses: record.expenses.map((e: any) => ({ category: e.category, type: e.type, planned: e.planned, actual: e.actual })),
            savingsGoal: record.savingsGoal
        }, null, 2);

        const prompt = FINANCE_INSIGHTS_PROMPT.replace('{{contextData}}', contextData);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: prompt
        });

        const result = await model.generateContent("Analyze my financial data accurately.");
        
        return result.response.text();

     } catch (error) {
         console.error("Error generating finance insights:", error);
         return "Failed to generate insights. Please try again later.";
     }
}
