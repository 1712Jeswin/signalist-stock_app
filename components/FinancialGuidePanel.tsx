'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, FileText, X, Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function FinancialGuidePanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [inputStr, setInputStr] = useState('');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    
    // PDF Generation
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    const handleChatToggle = () => setIsOpen(!isOpen);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputStr.trim()) return;

        const userMsg = inputStr.trim();
        setInputStr('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsThinking(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, sessionId })
            });

            const data = await res.json();
            
            if (data.error) {
                 setMessages(prev => [...prev, { role: 'assistant', content: 'Connection Error: ' + data.error }]);
                 setIsThinking(false);
                 return;
            }

            if (data.sessionId) setSessionId(data.sessionId);
            
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            
        } catch(err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'There was an error reaching your financial guide. Please try again later.' }]);
        } finally {
            setIsThinking(false);
        }
    };

     const handleGenerateReport = async () => {
          setIsGeneratingPdf(true);
          try {
              const res = await fetch('/api/report', { method: 'POST' });
              const data = await res.json();
              
              if (data.error) throw new Error(data.error);
              
              const element = document.createElement('div');
              element.innerHTML = `
                  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; padding: 10px;">
                      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px;">
                          <h1 style="font-size: 28px; color: #1e3a8a; margin: 0 0 10px 0; letter-spacing: -0.5px;">Personalized Investment Progress Report</h1>
                          <p style="color: #64748b; font-size: 14px; margin: 0;">Generated on: ${new Date().toLocaleString()}</p>
                      </div>
                      <div id="ai-pdf-content" style="font-size: 15px; color: #334155;">
                          ${data.content}
                      </div>
                      <div style="margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; page-break-inside: avoid;">
                          Disclaimer: This report is for informational purposes only. It does not constitute financial advice, and should not be relied upon for making investment decisions.
                      </div>
                  </div>
              `;

              // Force all children of ai-pdf-content to avoid page breaks mid-element
              const contentDiv = element.querySelector('#ai-pdf-content');
              if (contentDiv) {
                  Array.from(contentDiv.children).forEach((child) => {
                      if (child instanceof HTMLElement) {
                          child.style.pageBreakInside = 'avoid';
                          child.style.breakInside = 'avoid';
                          child.style.marginBottom = '20px';
                      }
                  });
              }

              // Dynamically import html2pdf to avoid SSR issues or global type definition requirements
              // @ts-ignore
              const html2pdf = (await import('html2pdf.js')).default;
              
              const opt = {
                  margin:       15,
                  filename:     'Investment_Progress_Report.pdf',
                  image:        { type: 'jpeg' as const, quality: 0.98 },
                  html2canvas:  { 
                      scale: 2, 
                      useCORS: true,
                      onclone: (clonedDoc: HTMLDocument) => {
                          // Crucial Fix: Strip Tailwind's global stylesheets in the cloned document
                          // because html2canvas crashes when parsing modern CSS `lab()` colors.
                          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                          styles.forEach(s => s.remove());
                      }
                  },
                  jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
                  pagebreak:    { mode: ['css', 'legacy'] }
              };

              // Trigger PDF generation and direct download
              await html2pdf().set(opt).from(element).save();

          } catch(err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              console.error(err);
              alert('Failed to generate report: ' + errorMessage);
          } finally {
              setIsGeneratingPdf(false);
          }
     };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-5">
            
            {/* Action Buttons (Always Visible) */}
            <div className="flex flex-col md:flex-row gap-4">
                <Button 
                    variant="default" 
                    className="relative overflow-hidden group bg-gradient-to-br from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-900 shadow-[0_8px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.5)] border border-yellow-400/20 transition-all duration-300 ease-out px-6 py-6 rounded-2xl"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingPdf}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_100%)] w-1/2 -skew-x-12 -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <FileText className="w-5 h-5 mr-3 text-amber-900 group-hover:scale-110 transition-transform" />}
                    <span className="font-bold tracking-wide">Download Report</span>
                </Button>

                {!isOpen && (
                    <Button 
                        variant="secondary" 
                        className="relative group bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 hover:border-yellow-500/50 hover:bg-slate-800 text-slate-100 shadow-2xl px-6 py-6 rounded-2xl transition-all duration-300"
                        onClick={handleChatToggle}
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                        <Bot className="w-6 h-6 mr-3 text-yellow-400 group-hover:text-yellow-300 group-hover:rotate-12 transition-all relative z-10" />
                        <span className="font-semibold relative z-10 tracking-wide">Ask Your Guide</span>
                    </Button>
                )}
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[380px] h-[550px] bg-[#0A0F1C]/95 backdrop-blur-3xl border border-yellow-500/20 rounded-3xl shadow-[0_20px_50px_-12px_rgba(245,158,11,0.25)] flex flex-col animate-in slide-in-from-bottom-5 overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-yellow-500/10 bg-gradient-to-r from-yellow-500/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-inner">
                                <Bot className="w-5 h-5 text-slate-900" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-100 tracking-wide text-sm">Financial Guide</h3>
                                <p className="text-xs text-yellow-500/80 font-medium">AI powered</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleChatToggle} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent">
                         {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-yellow-500/5 border border-yellow-500/20 flex items-center justify-center">
                                    <Bot className="w-8 h-8 text-yellow-500/50" />
                                </div>
                                <div>
                                    <p className="text-slate-300 font-medium text-sm">Hi! I&apos;m your neutral financial explainer.</p>
                                    <p className="mt-2 text-slate-500 text-xs leading-relaxed max-w-[80%] mx-auto">Ask me to analyze your pinned stocks, like &quot;Why did AAPL move this week?&quot;</p>
                                </div>
                            </div>
                         )}

                         {messages.map((m, idx) => (
                             <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                                     m.role === 'user' 
                                     ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-slate-900 font-medium rounded-tr-sm' 
                                     : 'bg-slate-800/60 backdrop-blur-sm text-slate-200 text-sm leading-relaxed border border-slate-700/50 rounded-tl-sm prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 overflow-x-auto selection:bg-yellow-500/30'
                                 }`}>
                                     {m.role === 'assistant' ? (
                                         <ReactMarkdown 
                                             remarkPlugins={[remarkGfm]}
                                         >
                                             {m.content}
                                         </ReactMarkdown>
                                     ) : (
                                         m.content
                                     )}
                                 </div>
                             </div>
                         ))}

                         {isThinking && (
                             <div className="flex justify-start">
                                 <div className="bg-slate-800/40 border border-slate-700/30 text-yellow-500/70 rounded-2xl rounded-tl-sm px-4 py-3 text-xs font-medium flex items-center gap-3 w-fit">
                                     <Loader2 className="w-4 h-4 animate-spin text-yellow-500" /> 
                                     Analyzing market data...
                                 </div>
                             </div>
                         )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-md">
                        <div className="flex gap-3 relative items-center">
                            <Input 
                                value={inputStr}
                                onChange={(e) => setInputStr(e.target.value)}
                                placeholder="Ask about your pinned stocks..." 
                                className="bg-slate-950/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 rounded-full pl-5 pr-12 focus-visible:ring-1 focus-visible:ring-yellow-500/50 focus-visible:border-yellow-500/50 h-11 transition-all shadow-inner"
                            />
                            <Button 
                                type="submit" 
                                size="icon" 
                                disabled={!inputStr.trim() || isThinking} 
                                className="absolute right-1.5 h-8 w-8 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 shadow-md transition-all disabled:opacity-50"
                            >
                                <Send className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                        </div>
                        <div className="text-center mt-3 flex items-center justify-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                             <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                             <span className="text-[10px] text-slate-400 tracking-wide uppercase font-medium">I do not provide financial advice</span>
                             <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                        </div>
                    </form>

                </div>
            )}
        </div>
    );
}
