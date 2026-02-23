import { ingestStockHistory } from "@/lib/eodhd/eodhd.ingest";

export async function POST(
  req: Request,
  { params }: { params: { symbol: string } }
) {
  await ingestStockHistory(params.symbol.toUpperCase());
  return Response.json({ status: "ok" });
}