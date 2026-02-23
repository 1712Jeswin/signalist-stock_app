'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Sparkles, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { updateFinanceRecord, generateFinanceInsights } from '@/lib/actions/finance.actions.server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Income = { source: string; planned: number; actual: number };
type Expense = { category: string; type: 'Fixed' | 'Variable'; planned: number; actual: number };
type Savings = { planned: number; actual: number };

export default function InvestmentDashboard({
    initialRecord,
    selectedMonth,
}: {
    initialRecord: any;
    selectedMonth: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isGenerating, setIsGenerating] = useState(false);
    const [insights, setInsights] = useState<string | null>(null);

    const [incomes, setIncomes] = useState<Income[]>(initialRecord.incomes || []);
    const [expenses, setExpenses] = useState<Expense[]>(initialRecord.expenses || []);
    const [savingsGoal, setSavingsGoal] = useState<Savings>(initialRecord.savingsGoal || { planned: 0, actual: 0 });

    const [newIncome, setNewIncome] = useState<Partial<Income>>({ source: '', planned: 0, actual: 0 });
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({ category: '', type: 'Fixed', planned: 0, actual: 0 });

    const handleMonthChange = (direction: 'prev' | 'next') => {
        const [yearStr, monthStr] = selectedMonth.split('-');
        let year = parseInt(yearStr);
        let month = parseInt(monthStr);

        if (direction === 'prev') {
            month -= 1;
            if (month < 1) { month = 12; year -= 1; }
        } else {
            month += 1;
            if (month > 12) { month = 1; year += 1; }
        }

        const newMonth = `${year}-${String(month).padStart(2, '0')}`;
        router.push(`/investment?month=${newMonth}`);
    };

    const handleSave = async () => {
        startTransition(async () => {
            await updateFinanceRecord(selectedMonth, { incomes, expenses, savingsGoal });
        });
    };

    const handleGenerateInsights = async () => {
        setIsGenerating(true);
        setInsights(null);
        await handleSave(); // save before insights
        const result = await generateFinanceInsights(selectedMonth);
        setInsights(result);
        setIsGenerating(false);
    };

    const handleAddIncome = () => {
        if (!newIncome.source) return;
        setIncomes([...incomes, { source: newIncome.source, planned: newIncome.planned || 0, actual: newIncome.actual || 0 }]);
        setNewIncome({ source: '', planned: 0, actual: 0 });
    };

    const handleAddExpense = () => {
        if (!newExpense.category) return;
        setExpenses([...expenses, { category: newExpense.category, type: newExpense.type as 'Fixed' | 'Variable', planned: newExpense.planned || 0, actual: newExpense.actual || 0 }]);
        setNewExpense({ category: '', type: 'Fixed', planned: 0, actual: 0 });
    };

    const renderVariance = (planned: number, actual: number, type: 'income' | 'expense') => {
        const diff = actual - planned;
        if (diff === 0) return <span className="text-slate-400">$0</span>;

        if (type === 'income') {
            return diff > 0 ? (
                <span className="text-emerald-400">+${(diff).toLocaleString()}</span>
            ) : (
                <span className="text-rose-400">-${Math.abs(diff).toLocaleString()}</span>
            );
        } else {
             // For expenses, being under actual < planned is good (green), over actual > planned is bad (red)
            return diff < 0 ? (
                <span className="text-emerald-400">-${Math.abs(diff).toLocaleString()}</span>
            ) : (
                <span className="text-rose-400">+${(diff).toLocaleString()}</span>
            );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Month Selector & Global Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#111827] p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')} className="bg-transparent border-slate-700 hover:bg-slate-800">
                        <ChevronLeft className="w-5 h-5 text-slate-300" />
                    </Button>
                    <span className="text-xl font-bold text-slate-200 w-32 text-center">
                        {new Date(`${selectedMonth}-02`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')} className="bg-transparent border-slate-700 hover:bg-slate-800">
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <Button 
                        onClick={handleSave} 
                        disabled={isPending}
                        className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                    <Button 
                        onClick={handleGenerateInsights} 
                        disabled={isGenerating || isPending}
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        AI Insights
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Tables */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* INCOMES */}
                    <div className="bg-[#111827] rounded-3xl border border-slate-800 overflow-hidden shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-200">Monthly Income</h2>
                        </div>
                        
                        {/* Add Income Form */}
                        <div className="flex items-end gap-3 mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800/80">
                            <div className="flex-1">
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Source</label>
                                <Input value={newIncome.source} onChange={e => setNewIncome({...newIncome, source: e.target.value})} className="h-9 bg-slate-900 border-slate-700" placeholder="e.g. Salary" />
                            </div>
                            <div className="w-28">
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Planned ($)</label>
                                <Input type="number" value={newIncome.planned || ''} onChange={e => setNewIncome({...newIncome, planned: Number(e.target.value)})} className="h-9 bg-slate-900 border-slate-700" placeholder="0" />
                            </div>
                            <div className="w-28">
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Actual ($)</label>
                                <Input type="number" value={newIncome.actual || ''} onChange={e => setNewIncome({...newIncome, actual: Number(e.target.value)})} className="h-9 bg-slate-900 border-slate-700" placeholder="0" />
                            </div>
                            <Button onClick={handleAddIncome} className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Display Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/80">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Source</th>
                                        <th className="px-5 py-3 font-semibold">Planned</th>
                                        <th className="px-5 py-3 font-semibold">Actual</th>
                                        <th className="px-5 py-3 font-semibold">Variance</th>
                                        <th className="px-5 py-3 text-right font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomes.map((inc, i) => (
                                        <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-5 py-3 font-medium text-slate-300">{inc.source}</td>
                                            <td className="px-5 py-3 text-slate-400">${inc.planned.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-slate-400">${inc.actual.toLocaleString()}</td>
                                            <td className="px-5 py-3 font-medium">
                                                {renderVariance(inc.planned, inc.actual, 'income')}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setIncomes(incomes.filter((_, idx) => idx !== i))} className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {incomes.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-slate-500 italic">No income entries added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* EXPENSES */}
                    <div className="bg-[#111827] rounded-3xl border border-slate-800 overflow-hidden shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-200">Monthly Expenses</h2>
                        </div>

                        {/* Add Expense Form */}
                        <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-800/80">
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Category</label>
                                <Input value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="h-9 bg-slate-900 border-slate-700" placeholder="e.g. Rent, Groceries" />
                            </div>
                            <div className="w-28">
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Type</label>
                                <select 
                                    value={newExpense.type} 
                                    onChange={e => setNewExpense({...newExpense, type: e.target.value as 'Fixed' | 'Variable'})}
                                    className="h-9 w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md text-sm px-2 focus:ring-1 focus:ring-slate-500"
                                >
                                    <option value="Fixed">Fixed</option>
                                    <option value="Variable">Variable</option>
                                </select>
                            </div>
                            <div className="w-28">
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Planned ($)</label>
                                <Input type="number" value={newExpense.planned || ''} onChange={e => setNewExpense({...newExpense, planned: Number(e.target.value)})} className="h-9 bg-slate-900 border-slate-700" placeholder="0" />
                            </div>
                            <div className="w-28">
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Actual ($)</label>
                                <Input type="number" value={newExpense.actual || ''} onChange={e => setNewExpense({...newExpense, actual: Number(e.target.value)})} className="h-9 bg-slate-900 border-slate-700" placeholder="0" />
                            </div>
                            <Button onClick={handleAddExpense} className="h-9 bg-amber-600 hover:bg-amber-500 text-white">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Display Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-900/80">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold w-1/3">Category</th>
                                        <th className="px-5 py-3 font-semibold">Type</th>
                                        <th className="px-5 py-3 font-semibold">Planned</th>
                                        <th className="px-5 py-3 font-semibold">Actual</th>
                                        <th className="px-5 py-3 font-semibold">Variance</th>
                                        <th className="px-5 py-3 text-right font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((exp, i) => (
                                        <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-5 py-3 font-medium text-slate-300">{exp.category}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${exp.type === 'Fixed' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                                    {exp.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-slate-400">${exp.planned.toLocaleString()}</td>
                                            <td className="px-5 py-3 text-slate-400">${exp.actual.toLocaleString()}</td>
                                            <td className="px-5 py-3 font-medium">
                                                {renderVariance(exp.planned, exp.actual, 'expense')}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setExpenses(expenses.filter((_, idx) => idx !== i))} className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-10 text-center text-slate-500 italic">No expense entries added yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Col: Savings & AI Insights */}
                <div className="space-y-6">
                    
                    {/* SAVINGS GOAL */}
                    <div className="bg-[#111827] rounded-3xl border border-slate-800 shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-slate-200 mb-4">Savings Goal</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Planned Savings ($)</label>
                                <Input 
                                    type="number" value={savingsGoal.planned || ''} placeholder="0" 
                                    onChange={(e) => setSavingsGoal({...savingsGoal, planned: Number(e.target.value)})} 
                                    className="bg-slate-900 border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-medium mb-1 block">Actual Savings ($)</label>
                                <Input 
                                    type="number" value={savingsGoal.actual || ''} placeholder="0" 
                                    onChange={(e) => setSavingsGoal({...savingsGoal, actual: Number(e.target.value)})} 
                                    className="bg-slate-900 border-slate-700"
                                />
                            </div>
                            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                                <span className="text-slate-400 tracking-wide">Variance</span>
                                <span className={`font-semibold ${savingsGoal.actual - savingsGoal.planned >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {savingsGoal.actual - savingsGoal.planned >= 0 ? "+" : "-"}${Math.abs(savingsGoal.actual - savingsGoal.planned).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* AI INSIGHTS */}
                    <div className="bg-gradient-to-b from-slate-900 to-[#111827] rounded-3xl border border-slate-800 shadow-lg p-6 relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                        
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-semibold text-emerald-50">Intelligent Insights</h2>
                        </div>

                        {insights ? (
                            <div className="prose prose-invert prose-sm max-w-none 
                                prose-p:leading-snug
                                prose-ul:my-2 prose-ul:list-disc prose-li:text-slate-300 prose-li:my-1
                                prose-strong:text-emerald-300 prose-strong:font-medium">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {insights}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-slate-800/20 rounded-xl border border-slate-800/50">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                        <p className="text-sm text-slate-400">Analyzing your data...</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                                        Click &quot;AI Insights&quot; to generate a neutral analysis of your monthly spending patterns.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
