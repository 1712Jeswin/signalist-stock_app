import { generateAIPrediction } from "@/lib/predictions/prediction.actions";
import Prediction from "@/database/models/prediction.model";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const resolvedParams = await params;
  const { searchParams } = new URL(req.url);
  const timeframe = (searchParams.get("timeframe") as "1d" | "7d" | "30d") || "1d";

  const aiResult = await generateAIPrediction(resolvedParams.symbol.toUpperCase(), timeframe);

  await Prediction.create({
    symbol: aiResult.symbol,
    timeframe: aiResult.timeframe,
    predictedPrice: aiResult.predictedPrice,
    currentPrice: aiResult.currentPrice,
    priceHistory: aiResult.priceHistory,
    confidence: aiResult.confidence,
    trend: aiResult.trend,
    reasoning: aiResult.reasoning,
    description: aiResult.description,
    riskLevel: aiResult.riskLevel,
    modelVersion: "gemini_2.5_flash_v1",
    predictedFor: new Date(Date.now() + (timeframe === '1d' ? 86400000 : timeframe === '7d' ? 86400000 * 7 : 86400000 * 30)),
  });

  return Response.json(aiResult);
}