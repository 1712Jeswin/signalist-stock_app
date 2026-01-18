"use client";

import {Bell, Trash2, TrendingDown, TrendingUp} from "lucide-react";
import {Button} from "@/components/ui/button";
import {deleteAlert} from "@/lib/actions/alert.actions";
import {toast} from "sonner";
import {useTransition} from "react";
import {formatPrice} from "@/lib/utils";

export default function AlertsPanel({alerts}: { alerts: Alert[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string) => {
        startTransition(async () => {
            const result = await deleteAlert(id);
            if (result.success) {
                toast.success("Alert deleted");
            } else {
                toast.error("Failed to delete alert");
            }
        });
    };

    return (
        <div className=' flex flex-col gap-2'>
            <div className="flex items-center gap-2 px-1">
                <Bell className="h-5 w-5 text-yellow-500"/>
                <h2 className="text-xl font-bold text-gray-100">Price Alerts</h2>
                <span className="ml-auto bg-gray-800 text-gray-400 text-xs font-bold px-2 rounded-full">
                    {alerts.length} Active
                </span>
            </div>

            <div className="w-full flex flex-col gap-6">

                <div className="flex flex-col gap-4">
                    {alerts.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center py-12 px-6 bg-[#1a1a1a] rounded-2xl border border-white/5 text-center">
                            <div className="bg-gray-800/50 p-4 rounded-full mb-4">
                                <Bell className="h-8 w-8 text-gray-600"/>
                            </div>
                            <p className="text-gray-400 font-medium">No alerts set yet</p>
                            <p className="text-gray-500 text-sm mt-1">Add alerts from your watchlist to get notified</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert._id}
                                className="group relative overflow-hidden bg-[#1a1a1a] hover:bg-[#222] border border-white/5 rounded-2xl p-4 transition-all duration-300"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {alert.logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={alert.logoUrl} alt={alert.company}
                                                 className="h-10 w-10 rounded-xl object-contain bg-white/5 p-1 border border-white/5"/>
                                        ) : (
                                            <div
                                                className="h-10 w-10 rounded-xl bg-gray-800 flex items-center justify-center font-bold text-gray-100 text-xs border border-white/5">
                                                {alert.symbol.substring(0, 2)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-gray-100 font-bold leading-tight">{alert.company}</h3>
                                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{alert.symbol}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(alert._id)}
                                        disabled={isPending}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span
                                            className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Condition</span>
                                        <div className="flex items-center gap-1.5">
                                            {alert.condition === 'greater' ? (
                                                <TrendingUp className="h-3.5 w-3.5 text-green-500"/>
                                            ) : alert.condition === 'less' ? (
                                                <TrendingDown className="h-3.5 w-3.5 text-red-500"/>
                                            ) : (
                                                <Bell className="h-3.5 w-3.5 text-blue-500"/>
                                            )}
                                            <span className="text-sm font-bold text-gray-100">
                                            Price {alert.condition === 'greater' ? '>' : alert.condition === 'less' ? '<' : '='} {formatPrice(alert.targetPrice)}
                                        </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span
                                            className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Frequency</span>
                                        <span
                                            className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md capitalize">
                                        {alert.frequency}
                                    </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
