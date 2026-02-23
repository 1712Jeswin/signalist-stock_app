export function calculateSMA(data: number[], window: number): number {
  if (data.length < window) return 0;
  const slice = data.slice(-window);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / window;
}

export function calculateEMA(data: number[], window: number): number {
  if (data.length < window) return 0;
  const k = 2 / (window + 1);
  // Start with SMA for first EMA
  let ema = calculateSMA(data.slice(0, window), window);
  
  for (let i = window; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateRSI(data: number[], window = 14): number {
  if (data.length <= window) return 50; // Default or neutral RSI

  let gains = 0;
  let losses = 0;

  // Calculate first average gain and loss
  for (let i = 1; i <= window; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / window;
  let avgLoss = losses / window;

  // Calculate smoothed RSI
  for (let i = window + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    let gain = 0;
    let loss = 0;

    if (change > 0) gain = change;
    else loss = -change;

    avgGain = (avgGain * (window - 1) + gain) / window;
    avgLoss = (avgLoss * (window - 1) + loss) / window;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateMACD(data: number[]): { macdLine: number; signalLine: number; histogram: number } {
  if (data.length < 26) return { macdLine: 0, signalLine: 0, histogram: 0 };
  
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macdLine = ema12 - ema26;
  
  // We need historical MACD values to reliably calculate the signal line (EMA of MACD).
  // For simplicity in this real-time inference, we approximate the signal if we lack full arrays.
  // In a robust system, we would map the MACD series and EMA that.
  
  // To compute the 9-day EMA of the MACD, we need the last ~35 points of data to build the MACD array.
  const macdSeries: number[] = [];
  for (let i = 26; i < data.length; i++) {
    const slice = data.slice(0, i + 1);
    const m = calculateEMA(slice, 12) - calculateEMA(slice, 26);
    macdSeries.push(m);
  }

  const signalLine = macdSeries.length >= 9 ? calculateEMA(macdSeries, 9) : macdLine;
  const histogram = macdLine - signalLine;

  return { macdLine, signalLine, histogram };
}
