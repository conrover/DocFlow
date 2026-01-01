
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { db } from '../services/db';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your DocFlow Assistant. I am synced with your current document queue. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getSystemContext = () => {
    const docs = db.getDocuments();
    const summary = docs.map(d => ({
      vendor: d.extraction?.specialized.invoice?.supplier_name || 'Unknown',
      invNum: d.extraction?.specialized.invoice?.invoice_number || 'N/A',
      total: `${d.extraction?.specialized.invoice?.currency || 'USD'} ${d.extraction?.specialized.invoice?.total || 0}`,
      status: d.status,
      confidence: (d.extraction?.fields.reduce((acc, f) => acc + f.confidence, 0) / (d.extraction?.fields.length || 1) * 100).toFixed(1) + '%',
      lineItems: d.extraction?.specialized.invoice?.line_items || []
    }));

    return `You are the DocFlow Assistant. You have access to the following live document data for the current user:
    ${JSON.stringify(summary)}

    Your goal:
    - Answer specific questions about these invoices (e.g. "How many are pending?", "What is the total from Global Corp?").
    - Provide advice on AP automation.
    - BE STRUCTURED: Use Markdown for all answers. Use headers (###), bold text (**text**), bullet points, and tables (| Col | Col |) for clarity.
    - If comparing invoices, always use a table.
    - If summarizing a single invoice, use a list of key attributes.
    - If asked about a vendor not in the list, state that it is not in the current queue.`;
  };

  const initChat = () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatInstanceRef.current = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: getSystemContext(),
      },
    });
    return chatInstanceRef.current;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chat = initChat();
      const response = await chat.sendMessage({ message: userMessage });
      const modelText = response.text || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm experiencing a slight connection issue with the brain trust. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple Markdown-to-HTML formatter for basic structure
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black">$1</strong>');
      // Headers
      if (formatted.startsWith('### ')) {
        return <h3 key={i} className="text-sm font-black uppercase tracking-tight mt-4 mb-2 text-blue-600">{formatted.replace('### ', '')}</h3>;
      }
      // List
      if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc text-xs mb-1" dangerouslySetInnerHTML={{ __html: formatted.replace(/^- |^\* /, '') }} />;
      }
      // Table Row
      if (formatted.includes('|')) {
        return <div key={i} className="font-mono text-[9px] bg-slate-100 p-1 px-2 border-x border-slate-200" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      return <p key={i} className="text-xs leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 md:w-[450px] h-[600px] bg-white rounded-[24px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">D</div>
              <div>
                <h3 className="text-white text-xs font-black uppercase tracking-widest">DocFlow Assistant</h3>
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Intelligence Synced</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-3xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}>
                  {msg.role === 'model' ? formatText(msg.text) : <p className="text-xs font-medium">{msg.text}</p>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 space-x-1 flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Query granular data (e.g. 'Compare vendors')..."
                className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button type="submit" disabled={isLoading || !inputValue.trim()} className="absolute right-3 top-2.5 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-black transition-all transform active:scale-90 relative group"
      >
        <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        {isOpen ? (
           <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
};

export default Chatbot;
