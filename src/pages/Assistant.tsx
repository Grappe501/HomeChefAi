import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Volume2 } from 'lucide-react';
import { assistantApi, billingApi, learningApi, inventoryStewardApi, ApiError } from '@/lib/api';
import { speak } from '@/lib/utils';
import { useApp } from '@/hooks/useApp';
import { assistantFirstName } from '@/lib/assistant';
import VoiceButton from '@/components/VoiceButton';
import SousChefMark from '@/components/SousChefMark';
import { ClaraEvidenceChips } from '@/components/ClaraEvidenceChips';
import { PreferenceConfirmCard } from '@/components/TasteLearningCards';
import { InventoryDeltaConfirmCard, UsageConfirmCard } from '@/components/InventoryStewardCards';
import type { PendingPreference } from '@/types/tasteLearning';
import type { PendingInventoryDelta, PendingUsageConfirm } from '@/types/inventorySteward';

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
  tools_used?: string[];
  pending_preference?: PendingPreference;
  pending_inventory_deltas?: PendingInventoryDelta;
  pending_usage?: PendingUsageConfirm;
  suggested_items?: { name: string; quantity: number; unit: string }[];
  action?: string;
}

const TOOL_LABELS: Record<string, string> = {
  lookup_pantry: 'Checking pantry',
  search_dishes: 'Searching recipe library',
  lookup_knowledge: 'Searching Kitchen Academy',
  find_substitutes: 'Finding substitutes',
  suggest_directions: 'Building directions',
  get_brain_context: 'Reading kitchen memory',
  skill_coach: 'Coaching technique',
  get_taste_profile: 'Reading taste profile',
  remember_preference: 'Staging preference',
  reconcile_inventory: 'Reconciling pantry',
  audit_pantry: 'Auditing pantry',
  apply_inventory_delta: 'Staging pantry update',
};

function shouldUseAgentStream(message: string): boolean {
  const m = message.trim();
  if (m.length <= 80) return false;
  if (/^(hi|hello|hey|thanks|thank you|ok|okay|yes|no)\b/i.test(m)) return false;
  if (/\bsubstitut/i.test(m)) return false;
  if (/\bwhat('s| is) in (my )?pantry\b/i.test(m)) return false;
  return true;
}

function toolLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, ' ');
}

export default function Assistant() {
  const { profile } = useApp();
  const [searchParams] = useSearchParams();
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
  const [toolProgress, setToolProgress] = useState<string[]>([]);
  const [synthesisDraft, setSynthesisDraft] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [savingPreference, setSavingPreference] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolProgress]);

  useEffect(() => {
    billingApi.status().then((s) => {
      if (s.credits) setCreditsRemaining(s.credits.remaining);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setInput(q);
  }, [searchParams]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setToolProgress([]);
    setSynthesisDraft('');
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      let result;

      if (shouldUseAgentStream(text)) {
        try {
          result = await assistantApi.chatStream(text, history, (event) => {
            if (event.type === 'tool_start' && typeof event.tool === 'string') {
              setToolProgress((prev) => [...prev, toolLabel(event.tool as string)]);
            }
            if (event.type === 'tool_done' && typeof event.tool === 'string') {
              setToolProgress((prev) => {
                const label = toolLabel(event.tool as string);
                return prev.map((p) => (p === label ? `${label} ✓` : p));
              });
            }
            if (event.type === 'synthesis') {
              setToolProgress((prev) => [...prev, 'Consulting expert advisors…']);
            }
            if (event.type === 'synthesis_start') {
              setSynthesisDraft('');
            }
            if (event.type === 'synthesis_token' && typeof event.token === 'string') {
              setSynthesisDraft((prev) => prev + event.token);
            }
            if (event.type === 'credit' && typeof event.credits_remaining === 'number') {
              setCreditsRemaining(event.credits_remaining);
            }
          });
        } catch {
          result = await assistantApi.chat(text, history);
        }
      } else {
        result = await assistantApi.chat(text, history);
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: result.reply.replace(/\*\*/g, ''),
        directions: result.directions,
        evidence: result.evidence,
        expert_ids: result.expert_ids,
        intent: result.intent,
        credit_cost: result.credit_cost,
        credits_remaining: result.credits_remaining,
        tools_used: result.tools_used,
        pending_preference: result.pending_preference,
        pending_inventory_deltas: result.pending_inventory_deltas,
        pending_usage: result.pending_usage ?? (
          result.suggested_items?.length && result.action === 'confirm_usage'
            ? { items: result.suggested_items }
            : undefined
        ),
        suggested_items: result.suggested_items,
        action: result.action,
      };
      if (result.credits_remaining !== undefined) setCreditsRemaining(result.credits_remaining);
      setMessages((m) => [...m, assistantMsg]);
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
      setToolProgress([]);
      setSynthesisDraft('');
    }
  };

  const confirmPreference = async (pref: PendingPreference, msgIndex: number) => {
    setSavingPreference(true);
    try {
      await learningApi.savePreference(pref);
      setMessages((m) =>
        m.map((msg, i) =>
          i === msgIndex
            ? {
                ...msg,
                pending_preference: undefined,
                action: undefined,
                content: `${msg.content}\n\nSaved — I'll remember ${pref.kind === 'avoid' ? 'to avoid' : pref.kind === 'prefer' ? 'that you prefer' : pref.kind}: ${pref.subject}.`,
              }
            : msg,
        ),
      );
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Could not save that preference. Try again from Settings or tell me again.' },
      ]);
    } finally {
      setSavingPreference(false);
    }
  };

  const confirmInventoryDelta = async (pending: PendingInventoryDelta, msgIndex: number) => {
    setSavingInventory(true);
    try {
      const result = await inventoryStewardApi.applyDelta(pending.deltas);
      setMessages((m) =>
        m.map((msg, i) =>
          i === msgIndex
            ? {
                ...msg,
                pending_inventory_deltas: undefined,
                action: undefined,
                content: `${msg.content}\n\nPantry updated${result.errors.length ? ` (${result.errors.join(', ')})` : ''}.`,
              }
            : msg,
        ),
      );
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Could not update pantry. Try again from Inventory.' }]);
    } finally {
      setSavingInventory(false);
    }
  };

  const confirmUsage = async (pending: PendingUsageConfirm, msgIndex: number) => {
    setSavingInventory(true);
    try {
      const deltas = pending.items.map((item) => ({
        action: 'subtract' as const,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }));
      await inventoryStewardApi.applyDelta(deltas);
      setMessages((m) =>
        m.map((msg, i) =>
          i === msgIndex
            ? {
                ...msg,
                pending_usage: undefined,
                suggested_items: undefined,
                action: undefined,
                content: `${msg.content}\n\nGot it — pantry updated.`,
              }
            : msg,
        ),
      );
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Could not deduct those items.' }]);
    } finally {
      setSavingInventory(false);
    }
  };

  const quickPrompts = [
    'What can I make for dinner?',
    "I'm out of eggs — what can I use?",
    "What's expiring soon?",
    'What expires this week?',
    'Audit my pantry',
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
                        onClick={() =>
                          send(
                            d.dish_id
                              ? `recipe:${d.dish_id}`
                              : `Build a plan around the ${d.cuisine_label} direction: ${d.title}`,
                          )
                        }
                        className="w-full text-left rounded-lg border border-steel bg-stainless-50 px-3 py-2 hover:border-chef/40"
                      >
                        <p className="text-xs font-semibold text-chef">{d.cuisine_label}</p>
                        <p className="text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-chef-subtle mt-0.5">{d.tagline}</p>
                        {d.dish_id && (
                          <p className="text-[10px] text-copper-700 mt-1 font-medium">Tap for full recipe</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && msg.pending_usage && msg.action === 'confirm_usage' && (
                  <UsageConfirmCard
                    pending={msg.pending_usage}
                    saving={savingInventory}
                    onConfirm={() => confirmUsage(msg.pending_usage!, i)}
                    onDismiss={() =>
                      setMessages((m) =>
                        m.map((row, idx) =>
                          idx === i ? { ...row, pending_usage: undefined, action: undefined } : row,
                        ),
                      )
                    }
                  />
                )}
                {msg.role === 'assistant' && msg.pending_inventory_deltas && msg.action === 'confirm_inventory_delta' && (
                  <InventoryDeltaConfirmCard
                    pending={msg.pending_inventory_deltas}
                    saving={savingInventory}
                    onConfirm={() => confirmInventoryDelta(msg.pending_inventory_deltas!, i)}
                    onDismiss={() =>
                      setMessages((m) =>
                        m.map((row, idx) =>
                          idx === i ? { ...row, pending_inventory_deltas: undefined, action: undefined } : row,
                        ),
                      )
                    }
                  />
                )}
                {msg.role === 'assistant' && msg.pending_preference && msg.action === 'confirm_preference' && (
                  <PreferenceConfirmCard
                    preference={msg.pending_preference}
                    saving={savingPreference}
                    onConfirm={() => confirmPreference(msg.pending_preference!, i)}
                    onDismiss={() =>
                      setMessages((m) =>
                        m.map((row, idx) =>
                          idx === i ? { ...row, pending_preference: undefined, action: undefined } : row,
                        ),
                      )
                    }
                  />
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
            <div className="max-w-[85%]">
              <p className="text-xs text-chef-subtle pl-1">{assistantName} says</p>
              <div className="bg-white border border-steel rounded-xl px-4 py-3 min-h-[52px] space-y-2">
                <p className="text-sm text-chef-subtle animate-pulse">
                  {toolProgress.length ? 'Gathering kitchen context…' : 'Thinking…'}
                </p>
                {toolProgress.length > 0 && (
                  <ul className="space-y-1">
                    {toolProgress.map((step, idx) => (
                      <li key={`${step}-${idx}`} className="text-xs text-chef-muted flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-copper-500 shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                )}
                {synthesisDraft && (
                  <p className="text-xs text-chef leading-relaxed border-t border-steel pt-2 mt-1 line-clamp-6">
                    {synthesisDraft.replace(/[{}"\\]/g, ' ').slice(0, 280)}
                  </p>
                )}
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
