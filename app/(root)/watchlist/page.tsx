'use client';

import React, { useState, useEffect } from 'react';
import { getWatchlistWithPrices, togglePinStock, toggleWatchlist } from '@/lib/actions/watchlist.actions.server';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp, Pin, PinOff, Search, ChevronRight, X, TrendingDown, DollarSign, Activity, BarChart3, BellRing, Trash2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { FinancialGuidePanel } from "@/components/FinancialGuidePanel";
import { SetAlertModal } from "@/components/SetAlertModal";

// --- Types ---
interface WatchlistItem {
    symbol: string;
    company: string;
    pinned: boolean;
    pinnedAt: string | null;
}
import { deleteAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';

export default function WatchlistPage() {
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [pinLoading, setPinLoading] = useState<string | null>(null);
    const [removeLoading, setRemoveLoading] = useState<string | null>(null);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [alerts, setAlerts] = useState<Record<string, any[]>>({});
    const [deletingAlert, setDeletingAlert] = useState<string | null>(null);
    const router = useRouter();
    
    // Modal state
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [selectedAlertSymbol, setSelectedAlertSymbol] = useState<string | null>(null);

    useEffect(() => {
        const fetchItems = async () => {
            setInitialLoading(true);
            const res = await getWatchlistWithPrices();
            if (res.data && 'watchlist' in res.data) {
                setItems(res.data.watchlist as WatchlistItem[]);
                setPrices(res.data.prices as Record<string, number>);
                if ('alerts' in res.data) {
                    setAlerts(res.data.alerts as Record<string, any[]>);
                }
            }
            setInitialLoading(false);
        };
        fetchItems();
    }, []);

    const handlePin = async (e: React.MouseEvent, symbol: string, currentPinnedState: boolean) => {
        e.stopPropagation();
        setPinLoading(symbol);
        await togglePinStock(symbol, currentPinnedState);
        setItems(prev => prev.map(i => {
            if (i.symbol === symbol) {
                return { ...i, pinned: !currentPinnedState };
            }
            return i;
        }).sort((a,b) => (b.pinned === a.pinned ? 0 : b.pinned ? 1 : -1)));
        setPinLoading(null);
    };

    const handleRemove = async (e: React.MouseEvent, symbol: string) => {
        e.stopPropagation();
        setRemoveLoading(symbol);
        try {
            const res = await toggleWatchlist(symbol);
            if (res.success) {
                toast.success(`${symbol} removed from watchlist`);
                setItems(prev => prev.filter(i => i.symbol !== symbol));
            } else {
                toast.error(res.error || 'Failed to remove from watchlist');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setRemoveLoading(null);
        }
    };

    const handleDeleteAlert = async (e: React.MouseEvent, alertId: string, symbol: string) => {
        e.stopPropagation();
        setDeletingAlert(alertId);
        try {
            const res = await deleteAlert(alertId);
            if (res.success) {
                toast.success('Alert deleted successfully');
                // Optimistically remove from state
                setAlerts(prev => {
                    const newAlerts = { ...prev };
                    if (newAlerts[symbol]) {
                        newAlerts[symbol] = newAlerts[symbol].filter(a => a._id !== alertId);
                    }
                    return newAlerts;
                });
            } else {
                toast.error(res.error || 'Failed to delete alert');
            }
        } catch(error) {
            toast.error('An error occurred');
        } finally {
            setDeletingAlert(null);
        }
    }

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-[#070B14] relative overflow-hidden flex items-center justify-center">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-600/10 rounded-full blur-[150px] pointer-events-none" />

                <div className="container mx-auto py-12 px-4 relative z-10 max-w-7xl flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin w-10 h-10 text-indigo-500" />
                    <p className="mt-4 text-slate-400">Loading your watchlist...</p>
                </div>
            </div>
        );
    }

    const pinnedStocks = items.filter(i => i.pinned);
    const unpinnedStocks = items.filter(i => !i.pinned);

    return (
        <div className="min-h-screen bg-[#070B14] relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-yellow-600/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="container mx-auto py-12 px-4 relative z-10 max-w-7xl">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
                            Market Watch
                        </h1>
                        <p className="text-slate-400 text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            Track your favorite assets in real-time
                        </p>
                    </div>
                </div>
                
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800">
                        <TrendingUp className="w-16 h-16 text-slate-600 mb-4" />
                        <h2 className="text-2xl font-semibold text-slate-300 mb-2">Your watchlist is empty</h2>
                        <p className="text-slate-500">Search for stocks and add them to monitor their performance.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Side: All Watchlist Table */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-semibold text-slate-200">Portfolio Tracker</h2>
                                <span className="bg-slate-800/80 text-slate-300 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-700">{items.length} Assets</span>
                            </div>
                            
                            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden transition-all duration-300">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/60">
                                            <TableHead className="text-slate-400 font-medium py-4 px-6">Symbol</TableHead>
                                            <TableHead className="text-slate-400 font-medium py-4">Company</TableHead>
                                            <TableHead className="text-right text-slate-400 font-medium py-4 px-6">AI Guide Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow 
                                                key={item.symbol} 
                                                className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors cursor-pointer group"
                                                onClick={() => router.push(`/stocks/${item.symbol}`)}
                                            >
                                                <TableCell className="font-bold text-slate-100 py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-yellow-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        {item.pinned && <Pin size={16} className="text-yellow-400 rotate-45 shrink-0" />}
                                                        <span className="text-lg tracking-wider">{item.symbol}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-400 group-hover:text-slate-300 transition-colors">
                                                    {item.company}
                                                </TableCell>
                                                <TableCell className="text-right py-4 px-6 flex justify-end items-center gap-4">
                                                    <Button
                                                        variant={"ghost"}
                                                        size="sm"
                                                        onClick={(e) => handlePin(e, item.symbol, item.pinned)}
                                                        disabled={pinLoading === item.symbol}
                                                        className={item.pinned 
                                                            ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20" 
                                                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}
                                                    >
                                                        {pinLoading === item.symbol ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : item.pinned ? (
                                                            <><PinOff className="w-4 h-4 mr-2" /> Unpin</>
                                                        ) : (
                                                            <><Pin className="w-4 h-4 mr-2" /> Pin</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => handleRemove(e, item.symbol)}
                                                        disabled={removeLoading === item.symbol}
                                                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        {removeLoading === item.symbol ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </Button>
                                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-yellow-500 transition-colors shrink-0 ml-2" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Right Side: Pinned Highlights Section */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                                    <Pin className="w-5 h-5 text-yellow-500" />
                                    Pinned by Guide
                                </h2>
                                {pinnedStocks.length > 0 && <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2.5 py-1 rounded-full font-medium border border-yellow-500/30">{pinnedStocks.length}</span>}
                            </div>
                            
                            {pinnedStocks.length === 0 ? (
                                <div className="bg-slate-900/30 border border-slate-800/80 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                        <Pin className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <p className="text-sm text-slate-400">Pin stocks to highlight them directly to your Financial Guide for deeper analysis.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {pinnedStocks.map(stock => (
                                        <div 
                                            key={stock.symbol}
                                            onClick={() => {
                                                setSelectedAlertSymbol(stock.symbol);
                                                setAlertModalOpen(true);
                                            }}
                                            className="group relative bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 rounded-2xl border border-slate-700/50 hover:border-yellow-500/50 hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)] transition-all cursor-pointer overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <TrendingUp className="w-16 h-16 text-yellow-500" />
                                            </div>
                                            <div className="flex items-center justify-between relative z-10 mb-2">
                                                <h3 className="text-2xl font-bold tracking-tight text-white">{stock.symbol}</h3>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 backdrop-blur-sm shadow-sm"
                                                    onClick={(e) => handlePin(e, stock.symbol, true)}
                                                >
                                                    {pinLoading === stock.symbol ? <Loader2 className="w-3 h-3 animate-spin" /> : <PinOff className="w-3 h-3" />}
                                                </Button>
                                            </div>
                                            <p className="text-slate-400 text-sm font-medium relative z-10 pr-12 truncate">{stock.company}</p>
                                            {prices[stock.symbol] && (
                                                <div className="mt-3 relative z-10">
                                                    <span className="text-xl font-semibold text-slate-200">${prices[stock.symbol].toFixed(2)}</span>
                                                    <span className="text-xs text-slate-500 ml-2">Current</span>
                                                </div>
                                            )}
                                            
                                            {/* Active Alerts Display */}
                                            {alerts[stock.symbol] && alerts[stock.symbol].length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-700/50 relative z-10 space-y-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                        <BellRing className="w-3.5 h-3.5" /> Active Alerts
                                                    </div>
                                                    {alerts[stock.symbol].map((alert, idx) => (
                                                        <div key={alert._id || idx} className="flex flex-row items-center justify-between text-sm bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                                            <div className="flex items-center gap-2">
                                                                {alert.condition === 'greater_than' ? (
                                                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                                ) : (
                                                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                                                )}
                                                                <span className="text-slate-300">
                                                                    {alert.condition === 'greater_than' ? 'Above' : 'Below'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-semibold text-slate-200">${alert.targetPrice.toFixed(2)}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="w-6 h-6 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-colors"
                                                                    onClick={(e) => handleDeleteAlert(e, alert._id, stock.symbol)}
                                                                    disabled={deletingAlert === alert._id}
                                                                >
                                                                    {deletingAlert === alert._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Financial Guide UI Tool */}
            <FinancialGuidePanel />

            <SetAlertModal 
                symbol={selectedAlertSymbol} 
                currentPrice={selectedAlertSymbol ? prices[selectedAlertSymbol] || null : null}
                open={alertModalOpen} 
                onOpenChange={(open: boolean) => {
                    setAlertModalOpen(open);
                    if (!open) {
                        // Quick re-fetch to show new alerts when modal closes
                        getWatchlistWithPrices().then(res => {
                             if (res.data && 'alerts' in res.data) {
                                 setAlerts(res.data.alerts as Record<string, any[]>);
                             }
                        });
                    }
                }} 
            />
        </div>
    );
}
