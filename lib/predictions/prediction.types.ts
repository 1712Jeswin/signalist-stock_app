export type AIPredictionResponse = {
  symbol: string;
  timeframe: "1d" | "7d" | "30d";
  predictedPrice: number;
  confidence: number;
  trend: "bullish" | "bearish" | "sideways";
  reasoning: string[];
  description: string;
  riskLevel: "low" | "medium" | "high";
  currentPrice?: number;
  priceHistory?: number[];
};
