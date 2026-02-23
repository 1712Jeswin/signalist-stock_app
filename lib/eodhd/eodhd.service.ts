const EODHD_BASE_URL = "https://eodhd.com/api";

export async function fetchHistoricalEOD(
  symbol: string,
  from = "2019-01-01",
  to?: string
) {
  const url = new URL(`${EODHD_BASE_URL}/eod/${symbol}.US`);

  url.searchParams.set("api_token", process.env.EODHD_API_KEY!);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("EODHD fetch failed");

  return res.json();
}