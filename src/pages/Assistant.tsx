import { useState, useRef, useEffect } from 'react';
import { Send, Volume2 } from 'lucide-react';
import { assistantApi, billingApi, ApiError } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { assistantFirstName } from '@/lib/assistant';
import VoiceButton from '@/components/VoiceButton';
import SousChefMark from '@/components/SousChefMark';
import { ClaraEvidenceChips } from '@/components/ClaraEvidenceChips';

import type { MealDirection } from '@/types/mealDirections';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  directions?: MealDirection[];
  evidence?: string[];
  expert_ids?: string[];
  intent?: string;
  credit_cost?: number;
  credits_remaining?: number;
}

export default function Assistant() {
  const { profile } = useApp();
  const assistantName = assistantFirstName(profile?.assistant_name);
  const [creditsRemaining, setCreditsRemaining] = useState<number | undefined>();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, Chef. Ask me what to cook, tell me what you made, or ask for a substitution — I route through the knowledge graph first.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    billingApi.status().then((s) => {
      if (s.credits) setCreditsRemaining(s.credits.remaining);
    }).catch(() => {});
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await assistantApi.chat(text, history);
      const assistantMsg: Message = {
        role: 'assistant',
        content: result.reply.replace(/\*\*/g, ''),
        directions: result.directions,
        evidence: result.evidence,
        expert_ids: result.expert_ids,
        intent: result.intent,
        credit_cost: result.credit_cost,
        credits_remaining: result.credits_remaining,
      };
      if (result.credits_remaining !== undefined) setCreditsRemaining(result.credits_remaining);
      setMessages((m) => [...m, assistantMsg]);
      // iOS blocks speechSynthesis unless triggered directly by tap — skip auto-read
      if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        speak(result.reply.replace(/\*\*/g, ''));
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Sorry, I had trouble with that. Try again?';
      setMessages((m) => [...m, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'What can I make for dinner?',
    "I'm out of eggs — what can I use?",
    "What's expiring soon?",
    'Substitute for butter',
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 -mx-4 px-4">
      <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
        <SousChefMark name={assistantName} className="mb-0" />
        {creditsRemaining !== undefined && (
          <p className="text-xs text-chef-subtle shrink-0 mt-1">
            {creditsRemaining} AI credits left
          </p>
        )}
      </div>

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
                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                {msg.directions && msg.directions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {msg.directions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => send(`Build a plan around the ${d.cuisine_label} direction: ${d.title}`)}
                        className="w-full text-left rounded-lg border border-steel bg-stainless-50 px-3 py-2 hover:border-chef/40"
                      >
                        <p className="text-xs font-semibold text-chef">{d.cuisine_label}</p>
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-chef-subtle mt-0.5">{d.tagline}</p>
                      </button>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && (
                  <>
                    <ClaraEvidenceChips
                      evidence={msg.evidence}
                      expertIds={msg.expert_ids}
                      intent={msg.intent}
                      creditCost={msg.credit_cost}
                      creditsRemaining={msg.credits_remaining}
                    />
                    <button
                      onClick={() => speak(msg.content)}
                      className="mt-2 btn-icon !w-[44px] !h-[44px] !min-w-[44px] !min-h-[44px] bg-stainless-200 text-chef-muted self-start"
                      aria-label="Listen"
                    >
                      <Volume2 size={16} />
                    </button>
                  </>
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

      <div className="flex flex-wrap gap-2 mb-3 shrink-0">
        {quickPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            className="text-sm bg-white border border-steel text-chef-subtle px-3 py-2.5 rounded-xl min-h-[44px]"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 px-4 pt-2 pb-1 bg-stainless-100 border-t border-steel/60 safe-area-pb">
        <div className="flex gap-2 items-center bg-white border border-steel rounded-xl p-2 shadow-card">
          <VoiceButton
            onTranscript={(t) => {
              setVoiceError(null);
              send(t);
            }}
            onError={setVoiceError}
          />
          <input
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Talk or type…"
            className="flex-1 px-2 py-3 focus:outline-none text-base min-h-[48px] bg-transparent"
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
          />
          <button
            type="button"
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="btn-icon bg-chef text-white disabled:opacity-40 shrink-0"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
        {voiceError && (
          <p className="text-xs text-burgundy-600 mt-1 px-1">{voiceError}</p>
        )}
      </div>
    </div>
  );
}
