import { NextResponse } from 'next/server';
import { processPinnedStocksData } from '@/lib/actions/ai.actions';
import { AI_FINANCIAL_GUIDE_PROMPT } from '@/lib/prompts.ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectToDatabase } from '@/database/mongoose';
import ChatSessionModel from '@/database/models/chatSession.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })
        const userId = session?.user?.id;
        
        if (!userId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, sessionId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        await connectToDatabase();

        // 1. Get Context Data
        const res = await processPinnedStocksData();
        const contextData = res.data;
        
        let contextJson = "No pinned stocks available.";
        let symbols: string[] = [];
        if (contextData) {
            contextJson = JSON.stringify(contextData, null, 2);
            symbols = contextData.map(d => d.symbol);
        }

        // 2. Prepare Chat Session
        let chatSession;
        if (sessionId) {
            chatSession = await ChatSessionModel.findById(sessionId);
        }
        
        if (!chatSession) {
             chatSession = new ChatSessionModel({
                 userId,
                 contextSymbols: symbols,
                 messages: []
             });
        }

        // Add user message
        chatSession.messages.push({
             role: 'user',
             content: message,
             timestamp: new Date()
        });

        // 3. Prepare Gemini Prompt
        const systemPrompt = AI_FINANCIAL_GUIDE_PROMPT
            .replace('{{contextData}}', contextJson)
            .replace('{{userQuestion}}', message);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        // Build history for the model
        const history = chatSession.messages.slice(0, -1).map((m: {role: string, content: string}) => ({
             role: m.role === 'assistant' ? 'model' as const : 'user' as const,
             parts: [{ text: m.content }]
        }));

        const chat = model.startChat({ history });

        // 4. Send Message & Get Response
        const result = await chat.sendMessage(systemPrompt);
        const responseText = result.response.text();

        // 5. Save AI Response
        chatSession.messages.push({
            role: 'assistant',
            content: responseText,
            timestamp: new Date()
        });

        await chatSession.save();

        return NextResponse.json({
            sessionId: chatSession._id,
            response: responseText
        });

    } catch (e: unknown) {
        console.error('Chat API Error:', e);
        const errorMessage = e instanceof Error ? e.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
