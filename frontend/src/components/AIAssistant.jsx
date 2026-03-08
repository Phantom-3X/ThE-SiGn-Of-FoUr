import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles,
  Search,
  ChevronRight,
  HelpCircle,
  Leaf
} from 'lucide-react';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  const suggestions = [
    "How is SDG Goal 11.2 performance?",
    "Optimize routes for carbon reduction",
    "Identify bottleneck zones",
    "System health check"
  ];

  const [chat, setChat] = useState([
    { role: 'assistant', content: 'Salutations. I am the Fleet Orchestration Intelligence. How can I assist in optimizing your sustainable transport network today?' }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newChat = [...chat, { role: 'user', content: message }];
    setChat(newChat);
    setMessage('');

    // Mock response
    setTimeout(() => {
      setChat([...newChat, { 
        role: 'assistant', 
        content: `Analyzing ${message}... Based on current telemetry, the network is achieving 82% intermodal synchronization. Consider deploying 2 additional units to Hub Vanaz to maintain SDG targets.` 
      }]);
    }, 800);
  };

  return (
    <>
      {/* Floating Toggle */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-primary text-white rounded-[2.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-[6px] border-white group"
      >
        <Sparkles size={32} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-[480px] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.05)] z-[60] transition-transform duration-500 ease-in-out border-l border-slate-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-10 border-b border-slate-50 bg-emerald-50/10">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight text-accent">Optimization AI</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Orchestrator V4 Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl hover:bg-slate-100 text-slate-300 transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-pro">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[1.8rem] text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white font-bold rounded-tr-none shadow-lg shadow-primary/20' 
                    : 'bg-slate-50 text-accent font-bold rounded-tl-none border border-slate-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Footer / Input */}
          <div className="p-10 bg-slate-50/50 border-t border-slate-100">
             <div className="mb-6 flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => setMessage(s)}
                    className="px-4 py-2 rounded-full bg-white border border-slate-100 text-[10px] font-black text-text-dim hover:text-primary hover:border-primary/40 transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
             </div>
             
             <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <Search size={18} className="text-slate-300 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Orchestrator AI..."
                  className="w-full bg-white border-2 border-slate-100 focus:border-primary rounded-3xl py-6 pl-16 pr-20 text-sm font-black text-accent focus:outline-none transition-all shadow-md focus:shadow-xl"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={20} />
                </button>
             </div>
             
             <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
               <Leaf size={14} />
               <span className="text-[9px] font-black uppercase tracking-[0.2em]">Optimized for SDG Goal 11.2</span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
