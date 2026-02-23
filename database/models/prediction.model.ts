import mongoose from "mongoose";

const PredictionSchema = new mongoose.Schema({
  symbol: { type: String, index: true },
  timeframe: { type: String }, // 1d, 7d, 30d
  predictedPrice: Number,
  currentPrice: Number,
  priceHistory: [Number],
  confidence: Number,
  trend: { type: String, enum: ["bullish", "bearish", "sideways"] },
  reasoning: [String],
  description: String,
  riskLevel: { type: String, enum: ["low", "medium", "high"] },
  modelVersion: String,
  generatedAt: { type: Date, default: Date.now },
  predictedFor: Date,
});

export default mongoose.models.Prediction ||
  mongoose.model("Prediction", PredictionSchema);