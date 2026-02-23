import { Document, Schema, model, models } from 'mongoose';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ChatSession extends Document {
    userId: string;
    contextSymbols: string[];
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessage>({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ChatSessionSchema = new Schema<ChatSession>({
    userId: { type: String, required: true, index: true },
    contextSymbols: [{ type: String }],
    messages: [ChatMessageSchema],
}, { timestamps: true });

const ChatSessionModel = models?.ChatSession || model<ChatSession>('ChatSession', ChatSessionSchema);

export default ChatSessionModel;
