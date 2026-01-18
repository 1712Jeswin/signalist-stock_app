'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const WatchlistButton = ({
    symbol,
    isInWatchlist,
    showTrashIcon = false,
    type = 'button',
    onWatchlistChange,
}: WatchlistButtonProps) => {
    const handleClick = () => {
        if (onWatchlistChange) {
            onWatchlistChange(symbol, !isInWatchlist);
        }
    };

    if (type === 'icon') {
        return (
            <button
                onClick={handleClick}
                className={cn('watchlist-icon-btn', isInWatchlist ? 'watchlist-icon-added' : 'watchlist-icon')}
            >
                {showTrashIcon && isInWatchlist ? (
                    <Trash2 className="h-4 w-4" />
                ) : (
                    <Star className={cn('h-4 w-4', isInWatchlist && 'fill-current')} />
                )}
            </button>
        );
    }

    return (
        <Button
            onClick={handleClick}
            className={cn('watchlist-btn', isInWatchlist && 'bg-yellow-500 text-black hover:bg-yellow-600')}
        >
            <Star className={cn('h-4 w-4 mr-2', isInWatchlist && 'fill-current')} />
            {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </Button>
    );
};

export default WatchlistButton;
