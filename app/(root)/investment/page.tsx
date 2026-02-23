import InvestmentDashboard from "@/components/InvestmentDashboard";
import { getFinanceRecord } from "@/lib/actions/finance.actions.server";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Investment & Personal Finance",
    description: "Track your monthly personal finances and gain AI insights.",
};

export default async function InvestmentPage({
    searchParams
}: {
    searchParams: Promise<{ month?: string }>
}) {
    const params = await searchParams;
    
    // Default to current month if no month is provided in query params
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = params.month || currentMonthStr;

    // Fetch or initialize the record for the selected month
    const initialRecord = await getFinanceRecord(selectedMonth);

    return (
        <section className="min-h-screen bg-[#0A0F1C] text-slate-200">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Investment & Finance</h1>
                        <p className="text-slate-400 mt-1">Track your monthly income, expenses, and savings goals.</p>
                    </div>
                </header>

                <InvestmentDashboard initialRecord={initialRecord} selectedMonth={selectedMonth} />

            </div>
        </section>
    );
}
