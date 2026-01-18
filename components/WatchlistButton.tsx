'use client';

import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleWatchlist } from '@/lib/actions/watchlist.actions';
import { toast } from 'sonner';

type WatchlistButtonProps = {
    symbol: string;
    company: string;
    isInWatchlist: boolean;
    userEmail?: string;
    showTrashIcon?: boolean;
    type?: 'button' | 'icon';
    onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
};

const WatchlistButton = ({
    symbol,
    company,
    isInWatchlist,
    userEmail,
    showTrashIcon = false,
    type = 'button',
    onWatchlistChange,
}: WatchlistButtonProps) => {
    const [isPending, startTransition] = useTransition();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userEmail) {
            toast.error('Please sign in to manage your watchlist');
            return;
        }

        startTransition(async () => {
            const result = await toggleWatchlist(userEmail, symbol, company);
            if (result.success) {
                if (onWatchlistChange) {
                    onWatchlistChange(symbol, !isInWatchlist);
                }
                toast.success(`${isInWatchlist ? 'Removed from' : 'Added to'} watchlist`);
            } else {
                toast.error(result.error || 'Failed to update watchlist');
            }
        });
    };

    if (type === 'icon') {
        return (
            <button
                onClick={handleClick}
                disabled={isPending}
                className={cn('watchlist-icon-btn disabled:opacity-50', isInWatchlist ? 'watchlist-icon-added' : 'watchlist-icon')}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : showTrashIcon && isInWatchlist ? (
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
            disabled={isPending}
            className={cn('watchlist-btn disabled:opacity-50', isInWatchlist && 'bg-yellow-500 text-black hover:bg-yellow-600')}
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Star className={cn('h-4 w-4 mr-2', isInWatchlist && 'fill-current')} />
            )}
            {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </Button>
    );
};

export default WatchlistButton;
