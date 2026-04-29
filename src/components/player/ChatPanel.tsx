'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { chatMessages } from '@/data/mock';
import { formatViewers } from '@/lib/utils';
import { cn } from '@/lib/utils';

const VIEWER_COUNT = 847200;

const colors = [
  'text-orange-400', 'text-blue-400', 'text-green-400',
  'text-purple-400', 'text-pink-400', 'text-yellow-400',
];

function getColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + hash * 31;
  return colors[Math.abs(hash) % colors.length];
}

export default function ChatPanel() {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: `user-${Date.now()}`,
      user: 'Você',
      message: input.trim(),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isHighlighted: false,
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="rounded-xl border border-[#2A2A3A] bg-[#1A1A26] flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2A3A]">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-orange-500" />
          <h3 className="text-white font-semibold text-sm">Chat ao Vivo</h3>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs">{formatViewers(VIEWER_COUNT)}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-1.5 p-2 rounded-lg text-xs',
              msg.isHighlighted ? 'bg-orange-500/10 border border-orange-500/20' : 'hover:bg-[#212132]',
              msg.user === 'Você' ? 'bg-blue-500/10 border border-blue-500/20' : ''
            )}
          >
            <span className={cn('font-bold shrink-0', getColor(msg.user), 'min-w-0')}>
              {msg.user}:
            </span>
            <span className="text-gray-300 break-words flex-1">{msg.message}</span>
            <span className="text-gray-700 text-[10px] shrink-0 mt-0.5">{msg.time}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#2A2A3A]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Enviar mensagem..."
            maxLength={200}
            className="flex-1 bg-[#12121A] border border-[#2A2A3A] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-400 disabled:bg-[#2A2A3A] disabled:cursor-not-allowed rounded-lg transition-all"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-gray-700 text-[10px] mt-1.5 px-1">
          Seja respeitoso. Mensagens inapropriadas serão removidas.
        </p>
      </div>
    </div>
  );
}
