"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert, CheckCircle2, AlertTriangle, TrendingDown, Target, Zap, X } from "lucide-react";

interface ExpenseAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any | null; // The JSON from Gemini
  loading: boolean;
}

export function ExpenseAnalysisModal({ open, onOpenChange, data, loading }: ExpenseAnalysisModalProps) {
  
  if (!open) return null;

  // Let's parse data if it's a string from the server action
  let AIAnalysis = null;
  let parseError = false;

  if (data && typeof data === 'string') {
    try {
        AIAnalysis = JSON.parse(data);
    } catch(e) {
        parseError = true;
    }
  } else if (data && typeof data === 'object') {
    AIAnalysis = data;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="!max-w-[80vw] w-[80vw] h-[85vh] p-0 bg-[#0B101A]/95 backdrop-blur-3xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[100]">
        
        {/* Dynamic Background Glow based on Status */}
        {AIAnalysis?.status === "CRITICAL" && <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />}
        {AIAnalysis?.status === "WARNING" && <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />}
        {AIAnalysis?.status === "EXCELLENT" && <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />}

        <div className="relative p-8 w-full flex flex-col h-full z-10">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 shrink-0 border-b border-slate-800 pb-6">
               <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
                        AIAnalysis?.status === "CRITICAL" ? "bg-rose-500/20 border-rose-500/40 text-rose-400" :
                        AIAnalysis?.status === "WARNING" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                        "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    }`}>
                        {AIAnalysis?.status === "CRITICAL" ? <ShieldAlert className="w-8 h-8" /> : 
                         AIAnalysis?.status === "WARNING" ? <AlertTriangle className="w-8 h-8" /> : 
                         <CheckCircle2 className="w-8 h-8" />}
                    </div>
                    <div>
                        <DialogTitle className="text-3xl font-black tracking-tight text-white mb-1">
                            Intelligent Expense Audit
                        </DialogTitle>
                        <p className="text-slate-400 text-sm font-medium tracking-wide">
                            AI-Powered Strict Pattern Recognition & Budget Enforcement
                        </p>
                    </div>
               </div>
               
               <button 
                onClick={() => onOpenChange(false)}
                className="w-12 h-12 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
               >
                <X className="w-6 h-6" />
               </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                
                {loading ? (
                    <div className="h-full w-full flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-t-2 border-emerald-500 animate-spin absolute inset-0 mix-blend-screen" />
                            <div className="w-24 h-24 rounded-full border-r-2 border-indigo-500 animate-spin absolute inset-0 animation-delay-500 mix-blend-screen" />
                            <div className="w-24 h-24 flex items-center justify-center bg-slate-900 rounded-full border border-slate-800 z-10 relative">
                                <Zap className="w-8 h-8 text-emerald-400 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm tracking-widest uppercase font-bold animate-pulse">Running Strict Audit...</p>
                    </div>
                ) : parseError ? (
                    <div className="h-full w-full flex flex-col items-center justify-center">
                         <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
                         <p className="text-xl text-white font-bold">Audit Parsing Failed</p>
                         <p className="text-slate-400 mt-2 text-center max-w-md">The AI returned an invalid analysis. Please try generating the insights again.</p>
                    </div>
                ) : AIAnalysis ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-center">
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-indigo-400" />
                                    Final Audit Verdict
                                </div>
                                <p className="text-lg text-slate-200 leading-relaxed">
                                    {AIAnalysis.finalVerdict}
                                </p>
                            </div>

                            <div className={`border p-6 rounded-2xl flex flex-col justify-center relative overflow-hidden ${
                                AIAnalysis.totalVariance < 0 ? "bg-rose-500/5 border-rose-500/20" : "bg-emerald-500/5 border-emerald-500/20"
                            }`}>
                                <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <TrendingDown className={`w-4 h-4 ${AIAnalysis.totalVariance < 0 ? "text-rose-400" : "text-emerald-400"}`} />
                                    <span className={AIAnalysis.totalVariance < 0 ? "text-rose-500/70" : "text-emerald-500/70"}>Savings Variance</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-5xl font-black tracking-tighter ${AIAnalysis.totalVariance < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                        {AIAnalysis.totalVariance < 0 ? "-" : "+"}${Math.abs(AIAnalysis.totalVariance).toLocaleString()}
                                    </span>
                                </div>
                                <p className={`text-sm mt-2 font-medium ${AIAnalysis.totalVariance < 0 ? "text-rose-400/80" : "text-emerald-400/80"}`}>
                                    {AIAnalysis.totalVariance < 0 ? "You have failed your monthly savings goal." : "You have successfully met or exceeded your savings bounds."}
                                </p>
                            </div>
                        </div>

                        {/* Wanted vs Unwanted Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Unwanted column */}
                            <div className="bg-rose-950/20 border border-rose-900/30 rounded-3xl p-6">
                                <h3 className="text-xl font-bold text-rose-400 mb-6 flex items-center gap-3">
                                    <X className="w-6 h-6 p-1 bg-rose-500/20 rounded-full" />
                                    Unwanted / Wasteful Spending
                                </h3>
                                <div className="space-y-4">
                                    {AIAnalysis.unwantedExpenses?.map((uw: any, i: number) => (
                                        <div key={i} className="bg-black/40 border border-rose-900/40 p-5 rounded-2xl flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-slate-200 text-lg">{uw.category}</span>
                                                <span className="font-black text-rose-400 text-lg">${uw.amountSpent.toLocaleString()}</span>
                                            </div>
                                            <div className="bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/10">
                                                <p className="text-sm text-rose-300 font-medium italic leading-relaxed">"{uw.harshCritique}"</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!AIAnalysis.unwantedExpenses || AIAnalysis.unwantedExpenses.length === 0) && (
                                        <div className="p-8 text-center text-rose-400/50 font-medium italic border border-dashed border-rose-900/50 rounded-2xl">
                                            No wasteful spending detected.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Wanted column */}
                            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-6">
                                <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 p-1 bg-emerald-500/20 rounded-full" />
                                    Approved / Necessary Spending
                                </h3>
                                <div className="space-y-4">
                                    {AIAnalysis.approvedExpenses?.map((ap: any, i: number) => (
                                        <div key={i} className="bg-black/40 border border-emerald-900/40 p-5 rounded-2xl flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-slate-200 text-lg">{ap.category}</span>
                                                <span className="font-bold text-slate-400 text-lg">${ap.amountSpent.toLocaleString()}</span>
                                            </div>
                                            <div className="bg-emerald-500/5 px-4 py-3 rounded-xl border border-emerald-500/10">
                                                <p className="text-sm text-emerald-300/80 font-medium leading-relaxed">"{ap.praise}"</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!AIAnalysis.approvedExpenses || AIAnalysis.approvedExpenses.length === 0) && (
                                        <div className="p-8 text-center text-emerald-400/50 font-medium italic border border-dashed border-emerald-900/50 rounded-2xl">
                                            No necessary fixed costs tracked.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Strict Guidelines Row */}
                        <div className="bg-slate-900/80 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden mt-8">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                            <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                                <Zap className="w-5 h-5 text-indigo-400" />
                                Strict Action Plan for Next Month
                            </h3>
                            <ul className="space-y-4">
                                {AIAnalysis.strictGuidelines?.map((guide: string, i: number) => (
                                    <li key={i} className="flex gap-4 items-start bg-black/40 p-4 rounded-xl border border-slate-800">
                                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
                                            {i + 1}
                                        </span>
                                        <p className="text-slate-200 font-medium leading-relaxed pt-1 flex-1">
                                            {guide}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                ) : null}
            </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
