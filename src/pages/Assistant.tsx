import { useState, useRef, useEffect } from 'react';
import { Send, Volume2 } from 'lucide-react';
import { assistantApi } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import VoiceButton from '@/components/VoiceButton';
import SousChefMark from '@/components/SousChefMark';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Assistant() {
  const { profile } = useApp();
  const assistantName = profile?.assistant_name || 'Clara';
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, Chef. Ask me what to cook, tell me what you made, or ask about your pantry.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await assistantApi.chat(text, history);
      const assistantMsg: Message = { role: 'assistant', content: result.reply };
      setMessages((m) => [...m, assistantMsg]);
      speak(result.reply);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I had trouble with that. Try again?' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What can I make for dinner?',
    "I haven't had BBQ in a while",
    "What's expiring soon?",
    'Plan a quick lunch for 2',
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)]">
      <SousChefMark name={assistantName} className="mb-4" />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'space-y-1'}`}>
              {msg.role === 'assistant' && (
                <p className="text-xs text-chef-subtle pl-1">{assistantName} says</p>
              )}
              <div
                className={`rounded-xl px-4 py-3 min-h-[52px] flex flex-col justify-center ${
                  msg.role === 'user'
                    ? 'bg-chef text-white rounded-br-sm'
                    : 'bg-white border border-steel rounded-bl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => speak(msg.content)}
                    className="mt-2 btn-icon !w-[44px] !h-[44px] !min-w-[44px] !min-h-[44px] bg-stainless-200 text-chef-muted self-start"
                    aria-label="Listen"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start space-y-1">
            <div>
              <p className="text-xs text-chef-subtle pl-1">{assistantName} says</p>
              <div className="bg-white border border-steel rounded-xl px-4 py-3 min-h-[52px] flex items-center">
                <p className="text-sm text-chef-subtle animate-pulse">Thinking…</p>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="text-sm bg-white border border-steel text-chef-subtle px-4 py-3 rounded-xl min-h-[52px]"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-center bg-white border border-steel rounded-xl p-2">
        <VoiceButton onTranscript={(t) => send(t)} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk or type…"
          className="flex-1 px-3 py-3 focus:outline-none text-base min-h-[52px]"
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="btn-icon bg-chef text-white disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
