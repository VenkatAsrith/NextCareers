'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { chatService } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm your AI Counselling Assistant. Ask me something like:\n*\"Can I get CSE at CBIT with 15k rank?\"* or *\"What was the cutoff for MREC?\"*" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const res = await chatService.sendMessage(userText);
      setMessages((prev) => [...prev, { sender: 'bot', text: res.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: err.message || "I couldn't process your request. Make sure you are logged in to use the AI assistant." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/\n/g, '<br/>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-tr from-[#FF6B35] to-[#E04F16] hover:from-[#E04F16] hover:to-[#FF6B35] text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer border border-[#FF6B35]/25"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-18 right-0 w-80 sm:w-96 h-[480px] premium-card rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/45">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#FF6B35]/15 border border-[#FF6B35]/35 flex items-center justify-center text-[#FF6B35]">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FF6B35] flex items-center space-x-1">
                    <span>Counselling AI</span>
                    <Sparkles size={12} className="text-[#FF6B35] animate-pulse" />
                  </h3>
                  <span className="text-[10px] text-zinc-500">TG EAPCET 2026 Engine</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-450 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#E04F16] text-[#F2EFE9] rounded-tr-none'
                        : 'bg-zinc-955/80 border border-zinc-800 text-zinc-200 rounded-tl-none'
                    }`}
                  >
                    {formatText(msg.text)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-955/80 border border-zinc-800 text-zinc-200 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-sm flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Form Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950/45 flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask e.g. MREC CSE with 42k..."
                className="flex-1 bg-zinc-900 border border-zinc-800 text-sm rounded-full px-4 py-2 text-zinc-200 focus:outline-none focus:border-[#FF6B35] transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-9 h-9 rounded-full bg-[#FF6B35] disabled:bg-[#FF6B35]/30 text-white hover:bg-[#FF8253] flex items-center justify-center transition-colors shadow-lg"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
