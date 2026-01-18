import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants"
import WatchlistButton from "@/components/WatchlistButton";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";

const WatchlistTable = ({ watchlist, userEmail, alerts, onAddAlert, onDeleteAlert }: { 
    watchlist: StockWithData[], 
    userEmail: string,
    alerts: Alert[],
    onAddAlert: (stock: SelectedStock) => void,
    onDeleteAlert: (alertId: string) => void 
}) => {
    const router = useRouter();

    return (
        <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
            <Table>
                <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                        {WATCHLIST_TABLE_HEADER.map((header) => (
                            <TableHead key={header} className="text-gray-400 font-medium py-4 text-left">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {watchlist.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={WATCHLIST_TABLE_HEADER.length} className="text-center py-10 text-gray-500">
                                Your watchlist is empty.
                            </TableCell>
                        </TableRow>
                    ) : (
                        watchlist.map((stock) => (
                            <TableRow 
                                key={stock.symbol} 
                                className="border-white/10 hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => router.push(`/stocks/${stock.symbol}`)}
                            >
                                <TableCell className="py-4 text-left">
                                    <div className="flex items-center gap-3">
                                        {stock.logo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={stock.logo} alt={stock.company} className="h-8 w-8 rounded-lg object-contain bg-white/5 p-1" />
                                        ) : (
                                            <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center font-bold text-gray-100 text-xs border border-white/5">
                                                {stock.symbol.substring(0, 2)}
                                            </div>
                                        )}
                                        <span className="font-bold text-gray-100">{stock.company}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-gray-400 text-left font-medium">{stock.symbol}</TableCell>
                                <TableCell className="text-gray-100 font-medium text-left">{stock.priceFormatted}</TableCell>
                                <TableCell className="text-left">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${stock.changePercent && stock.changePercent > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                        {stock.changeFormatted}
                                    </span>
                                </TableCell>
                                <TableCell className="text-gray-400 text-left">{stock.marketCap}</TableCell>
                                <TableCell className="text-gray-400 text-left">{stock.peRatio}</TableCell>
                                <TableCell className="text-left">
                                    {alerts.some(a => a.symbol === stock.symbol) ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const alert = alerts.find(a => a.symbol === stock.symbol);
                                                if (alert) onDeleteAlert(alert._id);
                                            }}
                                        >
                                            <Bell className="h-4 w-4 mr-1" />
                                            Delete Alert
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddAlert({
                                                    symbol: stock.symbol,
                                                    company: stock.company,
                                                    logo: stock.logo,
                                                    currentPrice: stock.currentPrice
                                                });
                                            }}
                                        >
                                            <Bell className="h-4 w-4 mr-1" />
                                            Add Alert
                                        </Button>
                                    )}
                                </TableCell>
                                <TableCell className="text-gray-100 text-left">
                                    <WatchlistButton
                                        symbol={stock.symbol}
                                        company={stock.company}
                                        isInWatchlist={true}
                                        userEmail={userEmail}
                                        showTrashIcon={true}
                                        type="icon"
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

export default WatchlistTable
