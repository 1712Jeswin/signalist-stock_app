import { fetchHistoricalEOD } from "@/lib/eodhd/eodhd.service";

export async function GET() {
  const data = await fetchHistoricalEOD("AAPL");
  return Response.json(data.slice(0, 5)); // first 5 days
}