'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { toggleWatchlist } from '@/lib/actions/watchlist.actions.server';

interface Props {
    symbol: string;
    initialIsWatchlisted: boolean;
}

export default function AddToWatchlistButton({ symbol, initialIsWatchlisted }: Props) {
    const [isWatchlisted, setIsWatchlisted] = useState(initialIsWatchlisted);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        const res = await toggleWatchlist(symbol);
        if (res && res.success) {
            setIsWatchlisted(res.isWatchlisted);
        }
        setLoading(false);
    };

    return (
        <Button 
            variant={isWatchlisted ? "secondary" : "default"} 
            className={`shadow-xl flex items-center gap-2 transition-all duration-300 ${isWatchlisted ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border border-yellow-500/20' : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-medium'}`}
            onClick={handleToggle}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-yellow-500 text-yellow-500' : 'text-slate-900'} transition-colors`} />}
            {isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}
        </Button>
    );
}
