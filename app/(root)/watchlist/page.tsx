import WatchlistTableWrapper from "@/components/WatchlistTableWrapper";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { getAlertsByEmail } from "@/lib/actions/alert.actions";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const WatchlistPage = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
        redirect("/sign-in");
    }

    const [watchlist, alerts] = await Promise.all([
        getWatchlistWithData(session.user.email),
        getAlertsByEmail(session.user.email)
    ]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-gray-100 tracking-tight">Market Watchlist</h1>
                <p className="text-gray-500 font-medium">Track your favorite stocks and set real-time price alerts.</p>
            </div>
            
            <WatchlistTableWrapper 
                initialWatchlist={watchlist} 
                initialAlerts={alerts} 
                userEmail={session.user.email} 
            />
        </div>
    );
};

export default WatchlistPage;
