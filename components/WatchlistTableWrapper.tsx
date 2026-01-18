"use client";

import { useState, useTransition } from "react";
import WatchlistTable from "@/components/WatchlistTable";
import AlertsPanel from "@/components/AlertsPanel";
import AlertModal from "@/components/AlertModal";
import { deleteAlert } from "@/lib/actions/alert.actions";
import { toast } from "sonner";

export default function WatchlistTableWrapper({ 
    initialWatchlist, 
    initialAlerts, 
    userEmail 
}: { 
    initialWatchlist: StockWithData[], 
    initialAlerts: Alert[], 
    userEmail: string 
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<SelectedStock | null>(null);
    const [, startTransition] = useTransition();

    const handleAddAlert = (stock: SelectedStock) => {
        setSelectedStock(stock);
        setIsModalOpen(true);
    };

    const handleDeleteAlert = (alertId: string) => {
        startTransition(async () => {
            const result = await deleteAlert(alertId);
            if (result.success) {
                toast.success("Alert deleted");
            } else {
                toast.error("Failed to delete alert");
            }
        });
    };

    return (
        <div className="flex flex-col xl:flex-row gap-8 items-start">
            <div className="flex-1 w-full overflow-x-auto">
                <WatchlistTable 
                    watchlist={initialWatchlist} 
                    userEmail={userEmail} 
                    alerts={initialAlerts}
                    onAddAlert={handleAddAlert}
                    onDeleteAlert={handleDeleteAlert}
                />
            </div>
            
            <div className="w-full xl:w-[400px] shrink-0">
                <AlertsPanel alerts={initialAlerts} />
            </div>

            <AlertModal 
                open={isModalOpen} 
                setOpen={setIsModalOpen} 
                stock={selectedStock}
                userEmail={userEmail}
            />
        </div>
    );
}
