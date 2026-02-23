import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchHistoricalEOD } from "@/lib/eodhd/eodhd.service";
import { getCurrentPrice } from "@/lib/actions/finnhub.actions";
import { QUANTITATIVE_TRADING_PROMPT } from "@/lib/predictions/prompts";
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from "@/lib/predictions/indicators";
import { AIPredictionResponse } from "@/lib/predictions/prediction.types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function generateAIPrediction(symbol: string, timeframe: "1d" | "7d" | "30d" = "1d"): Promise<AIPredictionResponse> {
  // 1. Fetch real-time price
  const currentPrice = await getCurrentPrice(symbol);
  
  // 2. Fetch history (let's get ~45 days to calculate indicators like 26-day MACD safely)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 60); // 60 days to ensure enough trading days
  const fromStr = fromDate.toISOString().split("T")[0];
  
  const historyData = await fetchHistoricalEOD(symbol, fromStr);
  if (!historyData || historyData.length === 0) {
    throw new Error("Failed to fetch historical data for " + symbol);
  }

  // Extract closing prices and volume
  const closes: number[] = historyData.map((d: any) => parseFloat(d.adjusted_close || d.close)).filter((x: any) => !isNaN(x));
  const volumes: number[] = historyData.map((d: any) => parseFloat(d.volume)).filter((x: any) => !isNaN(x));
  
  if (closes.length < 30) {
    throw new Error("Not enough data to generate predictions for " + symbol);
  }

  // 3. Calculate Indicators
  const latestPrice = currentPrice || closes[closes.length - 1]; // Fallback to last close if Finnhub fails
  const sma20 = calculateSMA(closes, 20);
  const ema20 = calculateEMA(closes, 20);
  const rsi14 = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const recentVolumeAvg = calculateSMA(volumes, 5);

  // 4. Construct feature matrix string for LLM
  const featureString = `
      Target Symbol: ${symbol}
      Requested Timeframe: ${timeframe}
      
      CURRENT MARKET DATA:
      Current Price: $${latestPrice}
      Average Recent Volume: ${recentVolumeAvg}
      
      TECHNICAL INDICATORS:
      - SMA (20): $${sma20.toFixed(2)}
      - EMA (20): $${ema20.toFixed(2)}
      - RSI (14): ${rsi14.toFixed(2)}
      - MACD Line: ${macd.macdLine.toFixed(2)}
      - MACD Signal: ${macd.signalLine.toFixed(2)}
      - MACD Histogram: ${macd.histogram.toFixed(2)}
      
      PRICE HISTORY (Last 10 Closes):
      ${closes.slice(-10).join(', ')}
  `;

  // 5. Call Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const promptContent = QUANTITATIVE_TRADING_PROMPT + "\n\n" + featureString;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptContent }] }],
    generationConfig: {
      temperature: 0.2, // Low temp for more deterministic, conservative output
      responseMimeType: "application/json",
    },
  });

  const responseText = result.response.text();
  
  try {
      const parsed: AIPredictionResponse = JSON.parse(responseText);
      // Fallback guarantees
      if (!parsed.timeframe) parsed.timeframe = timeframe;
      if (!parsed.symbol) parsed.symbol = symbol;
      
      // Inject our locally sourced data
      parsed.currentPrice = latestPrice;
      parsed.priceHistory = closes.slice(-30); // Return the full last 30 days for dynamic client-side charting
      
      return parsed;
  } catch(e) {
      console.error("Failed to parse Gemini execution response:", responseText);
      throw new Error("Model failed to return valid JSON");
  }
}
