"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, TrendingUp, TrendingDown, Minus, Activity, Target, ShieldAlert, Zap, X, ChevronDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis, XAxis, CartesianGrid } from "recharts";
import { AIPredictionResponse } from "@/lib/predictions/prediction.types";

interface PredictionModalProps {
  symbol: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PredictionModal({ symbol, open, onOpenChange }: PredictionModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"1d" | "7d" | "30d">("1d");

  useEffect(() => {
    if (!open || !symbol) {
      setData(null);
      setError(null);
      setTimeframe("1d");
      return;
    }

    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/chat/predictions/${symbol}?timeframe=1d`);
        if (!res.ok) throw new Error("Failed to fetch prediction");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Something went wrong while fetching the prediction data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [symbol, open]);

  // Chart Formatting natively sliced from the 30-day bundled payload
  const getSlicedHistory = () => {
    if (!data?.priceHistory) return [];
    let sliceAmount = -30;
    if (timeframe === "1d") sliceAmount = -2; // 2 data points for a single day line
    else if (timeframe === "7d") sliceAmount = -7; // Last 7 days
    return data.priceHistory.slice(sliceAmount);
  };

  const chartData = getSlicedHistory().map((price, i, arr) => {
    const daysAgo = arr.length - 1 - i;
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price
    };
  });
  
  // Trend Colors
  let TrendIcon = Minus;
  let trendColor = "text-slate-400";
  let trendBg = "bg-slate-500/10 border-slate-500/20";
  
  if (data?.trend === "bullish") {
    TrendIcon = TrendingUp;
    trendColor = "text-emerald-400";
    trendBg = "bg-emerald-500/10 border-emerald-500/20";
  } else if (data?.trend === "bearish") {
    TrendIcon = TrendingDown;
    trendColor = "text-red-400";
    trendBg = "bg-red-500/10 border-red-500/20";
  }

  // Risk UI mapping
  const getRiskUI = (level: string) => {
    switch (level) {
        case "low": return <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Low Risk</span>;
        case "high": return <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">High Risk</span>;
        default: return <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">Medium Risk</span>;
    }
  }

  // Synthesize Recommendation
  const getRecommendation = () => {
    if (!data) return null;
    if (data.trend === 'bullish' && data.confidence >= 0.7) return { text: 'Strong Buy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (data.trend === 'bullish') return { text: 'Buy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (data.trend === 'bearish' && data.confidence >= 0.7) return { text: 'Strong Sell', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    if (data.trend === 'bearish') return { text: 'Sell', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    return { text: 'Hold', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' };
  };
  const rec = getRecommendation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="!max-w-[70vw] w-[70vw] h-[75vh] p-0 bg-[#0B101A]/95 backdrop-blur-3xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full z-[100]">
        
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative p-6 sm:p-10 z-10 w-full h-full flex flex-col">
          {/* Header Row with Close Button */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Activity className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                  {symbol} <span className="text-slate-500 font-medium text-xl">Prediction Analysis</span>
                </DialogTitle>
                <p className="text-sm text-slate-400 mt-1">AI-powered quantitative sentiment for the next 24 hours.</p>
              </div>
            </div>
            
            <button 
              onClick={() => onOpenChange(false)}
              className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close prediction analysis"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content Wrapper */}
          <div className="flex-1 w-full flex flex-col justify-center">

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
              <p className="text-slate-400 text-sm animate-pulse tracking-widest uppercase">Running quantitative models...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 px-6">
              <ShieldAlert className="w-10 h-10 text-red-500/80 mb-2" />
              <p className="text-red-400 font-medium">{error}</p>
              <p className="text-slate-500 text-sm">Please try again later when the market data settles.</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Top Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Current Price</span>
                  <span className="text-xl font-bold text-white">${data.currentPrice?.toFixed(2) || "N/A"}</span>
                </div>
                
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Target Price
                  </span>
                  <span className="text-xl font-bold text-white">${data.predictedPrice.toFixed(2)}</span>
                </div>

                <div className={`border rounded-xl p-4 flex flex-col ${trendBg}`}>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Momentum</span>
                  <span className={`text-xl font-bold capitalize flex items-center gap-1.5 ${trendColor}`}>
                    <TrendIcon className="w-5 h-5" /> {data.trend}
                  </span>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Confidence</span>
                  <span className="text-xl font-bold text-indigo-400">{(data.confidence * 100).toFixed(0)}%</span>
                </div>

                <div className={`border rounded-xl p-4 flex flex-col ${rec?.bg || ''}`}>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Rating</span>
                  <span className={`text-xl font-bold uppercase tracking-wide flex items-center gap-1.5 ${rec?.color || ''}`}>
                    {rec?.text || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Redesigned Layout: Top Row (Feedback & Graph) + Bottom Row (Recommendations) */}
              <div className="flex flex-col space-y-8 mt-6">
                
                {/* Top Row: Feedback (Left) & Graph (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Feedback Box */}
                  <div className="bg-slate-900/30 p-6 md:p-8 rounded-2xl border border-slate-800/80 flex flex-col space-y-6 h-[400px]">
                    <h4 className="text-base font-semibold text-slate-300 flex items-center gap-2 shrink-0 border-b border-slate-800/50 pb-3">
                      <Zap className="w-5 h-5 text-yellow-500" /> Technical Feedback
                    </h4>
                    
                    {/* Fixed Height Scrollable Text Container */}
                    <div className="flex-1 overflow-y-auto pr-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                      <p className="text-sm text-slate-400/90 leading-relaxed whitespace-pre-wrap">
                        {data.description || "The AI model detected normal trading patterns matching historical baselines without significant divergent volatility."}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/60 shrink-0">
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Calculated Risk Profile</div>
                      <div className="inline-flex scale-110 origin-left">{getRiskUI(data.riskLevel)}</div>
                    </div>
                  </div>

                  {/* Right Column: Sparkline Graph Box */}
                  <div className="h-[400px] w-full flex flex-col justify-end min-w-0 bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.4} />
                            <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
                            <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `$${val.toFixed(0)}`} stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={40} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                              itemStyle={{ color: "#818cf8", fontWeight: "bold", fontSize: "16px" }}
                              formatter={(value: number) => [`$${value.toFixed(2)}`, "Close"]}
                              labelFormatter={(label) => label}
                              cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area 
                               type="monotone" 
                               dataKey="price" 
                               stroke="#818cf8" 
                               strokeWidth={3} 
                               fillOpacity={1} 
                               fill="url(#colorPrice)" 
                               activeDot={{ r: 6, fill: "#818cf8", stroke: "#0f172a", strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-800 rounded-lg">
                            <span className="text-slate-600 text-xs text-center px-4">Historical price chart unavailable for sparkline</span>
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-4">
                      {(["1d", "7d", "30d"] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          disabled={loading}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                            timeframe === tf
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              : "bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700 hover:text-slate-300"
                          }`}
                        >
                          {tf === '1d' ? '1 Day' : tf === '7d' ? '7 Days' : '30 Days'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: AI Recommendations */}
                <div className="w-full bg-slate-900/30 p-6 md:p-8 rounded-2xl border border-slate-800/80">
                  <h4 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-3 border-b border-slate-800/50 pb-4">
                    <Target className="w-6 h-6 text-indigo-400" /> AI Recommendations & Drivers
                  </h4>
                  
                  {data.reasoning && data.reasoning.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.reasoning.map((reason, idx) => (
                        <div key={idx} className="flex gap-4 items-start bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all cursor-default group">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1.5 shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.6)] group-hover:scale-125 transition-transform" />
                          <span className="text-sm text-slate-300 leading-relaxed font-medium group-hover:text-slate-200 transition-colors">{reason}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <p className="text-slate-500 text-sm">No specific drivers detected.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
