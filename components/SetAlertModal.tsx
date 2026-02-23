'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Bell } from 'lucide-react';
import { createAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';

interface SetAlertModalProps {
    symbol: string | null;
    currentPrice: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SetAlertModal({ symbol, currentPrice, open, onOpenChange }: SetAlertModalProps) {
    const [targetPrice, setTargetPrice] = useState<string>('');
    const [condition, setCondition] = useState<'greater_than' | 'less_than'>('greater_than');
    const [isLoading, setIsLoading] = useState(false);

    const handleSaveAlert = async () => {
        if (!symbol) return;
        const price = parseFloat(targetPrice);
        if (isNaN(price) || price <= 0) {
            toast.error('Please enter a valid target price.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await createAlert(symbol, price, condition);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Price alert set for ${symbol}!`);
                onOpenChange(false);
                setTargetPrice('');
            }
        } catch (error) {
            toast.error('Failed to set price alert.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-slate-950 border border-slate-800 shadow-2xl">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                            <Bell className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                Set Price Alert
                                <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                    {symbol}
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Get notified when {symbol} hits your target price.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Current Price Display */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
                        <span className="text-slate-400 font-medium">Current Price</span>
                        <span className="text-xl font-bold text-slate-200">
                            {currentPrice !== null ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2 relative z-50">
                            <label className="text-sm font-medium text-slate-300">Alert Condition</label>
                            <Select value={condition} onValueChange={(val: 'greater_than' | 'less_than') => setCondition(val)}>
                                <SelectTrigger className="w-full bg-slate-900 border-slate-800 text-slate-200 focus:ring-yellow-500">
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="greater_than" className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            <span>Goes above target price</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="less_than" className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                            <span>Drops below target price</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Target Price ($)</label>
                            <Input
                                type="number"
                                placeholder="e.g. 150.00"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-yellow-500/50 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAlert}
                            disabled={isLoading || !targetPrice || !symbol}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold min-w-[100px]"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Alert'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
