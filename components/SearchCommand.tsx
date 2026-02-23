"use client"

import { useEffect, useState, useTransition } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Star } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { toggleWatchlist } from "@/lib/actions/watchlist.actions.server";

// Assuming StockWithWatchlistStatus is globally available via finnhub.actions or similar
// If not, we can rely on `any` or extend the type loosely.
export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const [stocks, setStocks] = useState(initialStocks);
    const [addedStocks, setAddedStocks] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen(v => !v)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (!isSearchMode) {
                setStocks(initialStocks);
                return;
            }
            setLoading(true);
            try {
                const results = await searchStocks(searchTerm.trim());
                setStocks(results);
            } catch {
                setStocks([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, isSearchMode, initialStocks]);

    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
        setStocks(initialStocks);
    }

    const handleAddToWatchlist = async (e: React.MouseEvent, symbol: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Optimistic UI update
        setAddedStocks(prev => {
            const next = new Set(prev);
            next.add(symbol);
            return next;
        });

        startTransition(async () => {
            await toggleWatchlist(symbol);
        });
    }

    return (
        <>
            {renderAs === 'text' ? (
                <span onClick={() => setOpen(true)} className="search-text">
                    {label}
                </span>
            ) : (
                <Button onClick={() => setOpen(true)} className="search-btn">
                    {label}
                </Button>
            )}
            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
                    {loading && <Loader2 className="w-4 h-4 mr-4 animate-spin text-slate-400" />}
                </div>
                <CommandList className="search-list">
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Searching markets...</CommandEmpty>
                    ) : displayStocks?.length === 0 ? (
                        <div className="search-list-indicator p-4 text-center text-slate-500">
                            {isSearchMode ? 'No results found' : 'No stocks available'}
                        </div>
                    ) : (
                        <ul>
                            <div className="search-count p-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {isSearchMode ? 'Search results' : 'Popular stocks'}
                                {` `}({displayStocks?.length || 0})
                            </div>
                            {displayStocks?.map((stock: any) => {
                                const isAdded = addedStocks.has(stock.symbol);
                                return (
                                    <li key={stock.symbol} className="search-item relative group">
                                        <Link
                                            href={`/stocks/${stock.symbol}`}
                                            onClick={handleSelectStock}
                                            className="search-item-link flex items-center p-3 hover:bg-slate-800/50 rounded-lg transition-colors"
                                        >
                                            <TrendingUp className="h-5 w-5 mr-3 text-indigo-400" />
                                            <div className="flex-1">
                                                <div className="search-item-name font-medium text-slate-200">
                                                    {stock.name}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    {stock.symbol} &bull; {stock.exchange} &bull; {stock.type}
                                                </div>
                                            </div>
                                            
                                            <div className="ml-2 z-10" onClick={(e) => e.preventDefault()}>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className={`h-10 w-10 rounded-xl transition-all ${isAdded ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'hover:bg-slate-700'}`}
                                                    onClick={(e) => handleAddToWatchlist(e, stock.symbol)}
                                                    disabled={isPending || isAdded}
                                                    title={isAdded ? "Added to watchlist" : "Add to watchlist"}
                                                >
                                                    <Star className={`w-5 h-5 transition-colors ${isAdded ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 hover:text-yellow-400'}`} />
                                                </Button>
                                            </div>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}