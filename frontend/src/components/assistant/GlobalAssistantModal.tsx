import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api.js';
import { useJourney } from '../../context/JourneyContext.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const GlobalAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeJourney, readiness } = useJourney();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-01',
      role: 'assistant',
      content: `### Hello! I am your MidBridge 2.0 Mobility Assistant.\n\nI have live context of your active journey roadmap, requirement checklist, and vault documents. How can I help you prepare today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickPrompts = [
    'What documents am I missing?',
    'What scholarships match my destination?',
    'What is required for the visa appointment?',
    'Which document expires first?',
    'What should I do next to raise my readiness?',
  ];

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText,
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post<{ answer: string }>('/assistant/ask', { prompt: queryText });
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Apologies, I encountered a temporary connection glitch while analyzing your journey data. Please try again.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg h-full bg-[#0a0a0e] border-l border-white/10 shadow-2xl flex flex-col justify-between"
        style={{ animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>MidBridge 2.0 Assistant</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Journey Sync
                </span>
              </div>
              <div className="text-xs text-white/50">
                {activeJourney ? `${activeJourney.from_country} → ${activeJourney.to_country} (${activeJourney.purpose}) • ${readiness?.overallScore ?? activeJourney.readiness_score}% ready` : 'Global Advisory Mode'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-white/80" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-white/20 text-white border border-white/20 rounded-tr-none'
                    : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none prose prose-invert prose-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserIcon className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-white/50 pl-10">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Analyzing journey requirements and document vault...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="p-3 border-t border-white/5 bg-white/[0.01]">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2 font-mono">Suggested Questions</div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.slice(0, 3).map(prompt => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>{prompt}</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-black/60">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about requirements, missing files, or scholarships..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-full btn-primary flex items-center justify-center disabled:opacity-40 transition-opacity"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
