import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, BrainCircuit, Plus, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useDashboardData } from '@/lib/dashboardData';

export function AiAgentPage() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: "Hello! I'm your GoldEx AI Assistant. I can help when live market or account data is available. How can I assist you?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { profile, totals, investments } = useDashboardData(user?.uid);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const askTechnicalAnalysis = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const promptText = "Analyze the current XAU/USD gold price structure and technical indicators. Give me a professional technical analysis with support/resistance levels, trend, and overall outlook based on the live price.";
    const userMessage = { role: 'user', content: promptText };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userContext: {
            uid: user?.uid,
            displayName: profile?.displayName || user?.displayName || null,
            totalInvested: totals.lockedPrincipal,
            totalProfit: totals.totalEarned,
            withdrawableProfit: totals.withdrawableProfit,
            activeInvestments: investments.filter((investment) => investment.status === 'active').length,
            dataSource: "live",
            hasLivePortfolioData: investments.length > 0
          }
        })
      });

      if (!response.ok) throw new Error("Failed to communicate with AI");
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I am currently unable to reach the server. Please verify your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          userContext: {
            uid: user?.uid,
            displayName: profile?.displayName || user?.displayName || null,
            totalInvested: totals.lockedPrincipal,
            totalProfit: totals.totalEarned,
            withdrawableProfit: totals.withdrawableProfit,
            activeInvestments: investments.filter((investment) => investment.status === 'active').length,
            dataSource: "live",
            hasLivePortfolioData: investments.length > 0
          }
        })
      });

      if (!response.ok) throw new Error("Failed to communicate with AI");
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I am currently unable to reach the server. Please verify your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full mx-auto bg-dark-950 rounded-[14px] border border-[#D4AF37]/10 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      
      {/* Left Sidebar (Desktop only) */}
      <div className="hidden lg:flex w-[280px] flex-col bg-[rgba(3,3,5,0.80)] border-r border-[#D4AF37]/10 shrink-0">
        <div className="p-4 border-b border-[#D4AF37]/10">
           <button className="btn-ghost w-full h-[36px] flex items-center justify-center gap-2 text-[13px] rounded-[8px]">
             <Plus className="w-4 h-4" /> New Chat
           </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
           <h3 className="font-sans text-[11px] font-medium text-text-muted uppercase tracking-wider mb-4 px-2">Conversations</h3>
           <div className="space-y-1">
             <div className="flex items-center gap-3 px-3 py-2.5 bg-[#D4AF37]/10 text-gold rounded-[8px] border border-[#D4AF37]/20">
               <MessageSquare className="w-4 h-4 shrink-0" />
               <span className="font-sans text-[13px] font-medium truncate">Current Session</span>
             </div>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03)_0%,transparent_70%)] relative">
         <div className="p-[16px_24px] border-b border-[#D4AF37]/10 flex items-center justify-between bg-[rgba(7,7,12,0.6)] backdrop-blur-xl relative z-10">
           <div className="flex items-center gap-4">
             <div className="w-[40px] h-[40px] rounded-full bg-[linear-gradient(135deg,#FFD700_0%,#F5C518_100%)] p-[1px] shadow-[0_0_12px_rgba(212,175,55,0.2)]">
                <div className="w-full h-full bg-[#0C0C16] rounded-full flex items-center justify-center overflow-hidden">
                   <img src="/images/AI Agent Avatar.png" alt="AI Avatar" className="w-full h-full object-cover" />
                </div>
             </div>
             <div>
               <h2 className="font-display font-medium text-[18px] text-white leading-tight">GoldEx AI Agent</h2>
               <div className="flex items-center gap-[6px] font-sans text-[12px] text-text-muted mt-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-profit-green shadow-[0_0_4px_#00F5A0]" /> Online
               </div>
             </div>
           </div>
           
           <div className="hidden sm:flex px-3 py-1.5 bg-[#0C0C16] border border-[#D4AF37]/20 rounded-full items-center gap-2">
             <BrainCircuit className="w-3.5 h-3.5 text-gold-500" />
             <span className="font-sans font-medium text-[10px] text-gold-500 tracking-wider">ADVANCED REASONING</span>
           </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 relative z-0">
           {messages.map((msg, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
             >
               <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                 
                 <div className={cn(
                   "px-[20px] py-[14px]",
                   msg.role === 'user' 
                     ? "bg-[linear-gradient(135deg,#FFD700_0%,#F5C518_100%)] text-[#0A0800] rounded-[18px] rounded-tr-[4px] shadow-[0_4px_12px_rgba(212,175,55,0.15)]" 
                     : "bg-[#11111E] border border-[#D4AF37]/10 text-white rounded-[18px] rounded-tl-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                 )}>
                   <div className={cn("font-sans text-[14px] leading-[1.6]", msg.role === 'user' ? "font-medium" : "prose prose-invert max-w-none prose-p:leading-[1.6] prose-a:text-gold-500")}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                   </div>
                 </div>
                 
               </div>
             </motion.div>
           ))}
           
           {isLoading && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
               <div className="px-[20px] py-[16px] bg-[#11111E] border border-[#D4AF37]/10 rounded-[18px] rounded-tl-[4px] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#D4AF37]/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-[#D4AF37]/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[#D4AF37]/60 rounded-full animate-bounce" />
               </div>
             </motion.div>
           )}
           <div ref={bottomRef} className="h-[20px]" />
         </div>

         {/* Input Area */}
         <div className="p-4 sm:p-6 bg-transparent relative z-10 flex flex-col gap-3">
           {/* Quick Action Buttons */}
           <div className="flex justify-center w-full max-w-4xl mx-auto">
             <button
               type="button"
               onClick={askTechnicalAnalysis}
               disabled={isLoading}
               className="btn-ghost flex items-center justify-center gap-2 text-xs font-sans text-gold-500 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 px-4 py-2 rounded-full disabled:opacity-50 transition-all hover:scale-102"
             >
               <BrainCircuit className="w-4 h-4 animate-pulse" /> Ask AI for XAUUSD Technical Analysis
             </button>
           </div>

           <form onSubmit={sendMessage} className="relative max-w-4xl mx-auto flex items-center w-full">
             <div className="absolute inset-0 bg-[#0C0C16] border border-[#D4AF37]/20 rounded-[32px] pointer-events-none" />
             <input 
               type="text" 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder="Chat with GoldEx AI..."
               className="w-full bg-transparent text-white placeholder:text-[#E8E4D4]/30 font-sans text-[15px] py-[16px] pl-[24px] pr-[64px] focus:outline-none relative z-10"
             />
             <button 
               type="submit" 
               disabled={!input.trim() || isLoading} 
               className="absolute right-2 z-10 w-[40px] h-[40px] rounded-full bg-[linear-gradient(135deg,#FFD700_0%,#F5C518_100%)] text-[#0A0800] flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 mr-1"
             >
               <Send className="w-[18px] h-[18px] ml-[2px]" />
             </button>
           </form>
         </div>
      </div>

    </div>
  );
}
