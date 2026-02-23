import StockHistory from "@/database/models/stockHistory.model";
import { fetchHistoricalEOD } from "./eodhd.service";

export async function ingestStockHistory(symbol: string) {
  const candles = await fetchHistoricalEOD(symbol);

  const docs = candles.map((c: any) => ({
    symbol,
    date: new Date(c.date),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));

  await StockHistory.bulkWrite(
    docs.map((d: any) => ({
      updateOne: {
        filter: { symbol: d.symbol, date: d.date },
        update: { $set: d },
        upsert: true,
      },
    }))
  );
}