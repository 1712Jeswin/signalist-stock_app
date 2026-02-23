import { NextResponse } from 'next/server';
import { processWatchlistStocksData } from '@/lib/actions/ai.actions';
import { INVESTMENT_REPORT_PROMPT } from '@/lib/prompts.ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST() {
    try {
         const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        
        if (!userId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const res = await processWatchlistStocksData();
        
        if (res.error) {
            return NextResponse.json({ error: res.error }, { status: 400 });
        }

        const contextData = res.data;
        if (!contextData || contextData.length === 0) {
            return NextResponse.json({ content: "No pinned stocks available to generate report." });
        }

        const contextJson = JSON.stringify(contextData, null, 2);

        const prompt = INVESTMENT_REPORT_PROMPT.replace('{{contextData}}', contextJson);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        return NextResponse.json({
            content: responseText,
            rawData: contextData // Send raw data back for the PDF to format nicely
        });

    } catch (e: unknown) {
        console.error('Report API Error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
