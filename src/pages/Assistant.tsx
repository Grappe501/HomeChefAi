import { useState, useRef, useEffect } from 'react';
import { Send, Volume2 } from 'lucide-react';
import { assistantApi } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import VoiceButton from '@/components/VoiceButton';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Assistant() {
  const { profile } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm ${profile?.assistant_name || 'Sous Chef'}. Ask me what to cook, tell me what you made, or ask about your pantry. Tap the mic to talk!`,
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
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I had trouble with that. Try again?' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What can I make for dinner?",
    "I haven't had BBQ in a while",
    "What's expiring soon?",
    "Plan a quick lunch for 2",
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)]">
      <h2 className="font-sans font-semibold text-xl text-chef mb-3">{profile?.assistant_name || 'Sous Chef'}</h2>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-chef text-white rounded-br-md'
                  : 'bg-white border border-steel rounded-bl-md'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.role === 'assistant' && (
                <button onClick={() => speak(msg.content)} className="mt-1 text-steel-dark hover:text-copper-500">
                  <Volume2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-steel rounded-2xl px-4 py-3">
              <p className="text-sm text-steel-dark animate-pulse">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => send(p)} className="text-xs bg-stainless-200 text-chef-subtle px-3 py-1.5 rounded-full">
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center bg-white border border-steel rounded-2xl p-2">
        <VoiceButton onTranscript={(t) => send(t)} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk or type..."
          className="flex-1 px-2 py-2 focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()} className="btn-icon bg-chef text-white">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
