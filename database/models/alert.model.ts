import { Document, Schema, model, models } from 'mongoose';

export interface AlertItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  logoUrl?: string;
  condition: 'greater' | 'less' | 'equal';
  targetPrice: number;
  frequency: 'once' | 'daily';
  isActive: boolean;
  createdAt: Date;
}

const AlertSchema = new Schema<AlertItem>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  logoUrl: {
    type: String,
    trim: true,
  },
  condition: {
    type: String,
    enum: ['greater', 'less', 'equal'],
    required: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  frequency: {
    type: String,
    enum: ['once', 'daily'],
    default: 'once',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries by user and symbol
AlertSchema.index({ userId: 1, symbol: 1 });

const Alert = models?.Alert || model<AlertItem>('Alert', AlertSchema);

export default Alert;
