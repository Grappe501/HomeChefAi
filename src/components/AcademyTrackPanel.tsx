import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Clock, MessageCircle, Trophy, UtensilsCrossed } from 'lucide-react';
import { knowledgeApi } from '@/lib/api';
import type { AcademyLevel, DeepKnowledgeEntry } from '@/types/knowledgeDeep';
import type { DishMatch } from '@/types/dish';

interface AcademyTrackPanelProps {
  track: DeepKnowledgeEntry;
  /** When false, hide live recipe suggestions (marketing preview). */
  practiceEnabled?: boolean;
  dark?: boolean;
}

interface PracticeState {
  loading: boolean;
  dishes: DishMatch[];
  clara_prompt: string;
  error?: string;
}

export default function AcademyTrackPanel({ track, practiceEnabled = true, dark = false }: AcademyTrackPanelProps) {
  const levels = track.levels ?? [];
  const card = dark ? 'rounded-xl border border-white/10 bg-white/5' : 'card';
  const muted = dark ? 'text-white/50' : 'text-chef-subtle';
  const text = dark ? 'text-white/85' : 'text-chef';
  const accent = dark ? 'text-copper-300' : 'text-copper-600';

  return (
    <section className="space-y-4">
      {track.shows_referenced && track.shows_referenced.length > 0 && (
        <p className={`text-xs ${muted}`}>
          Inspired by: {track.shows_referenced.join(' · ')}
        </p>
      )}

      {levels.map((level) => (
        <LevelBlock
          key={level.id}
          trackId={track.id}
          level={level}
          practiceEnabled={practiceEnabled}
          card={card}
          muted={muted}
          text={text}
          accent={accent}
          dark={dark}
        />
      ))}
    </section>
  );
}

function LevelBlock({
  trackId,
  level,
  practiceEnabled,
  card,
  muted,
  text,
  accent,
  dark,
}: {
  trackId: string;
  level: AcademyLevel;
  practiceEnabled: boolean;
  card: string;
  muted: string;
  text: string;
  accent: string;
  dark: boolean;
}) {
  const [open, setOpen] = useState(level.rank === 1);

  return (
    <div className={card}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left p-4 sm:p-5"
      >
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${accent}`}>
            Level {level.rank}
          </p>
          <h3 className={`font-semibold text-lg mt-1 ${dark ? 'text-white' : 'text-chef'}`}>{level.title}</h3>
          <p className={`text-sm mt-1 ${muted}`}>{level.description}</p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 mt-1 transition ${open ? 'rotate-180' : ''} ${muted}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3 border-t border-steel/40 pt-3">
          {level.modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              trackId={trackId}
              levelId={level.id}
              module={mod}
              practiceEnabled={practiceEnabled}
              muted={muted}
              text={text}
              accent={accent}
              dark={dark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleCard({
  trackId,
  levelId,
  module: mod,
  practiceEnabled,
  muted,
  text,
  accent,
  dark,
}: {
  trackId: string;
  levelId: string;
  module: import('@/types/knowledgeDeep').AcademyModule;
  practiceEnabled: boolean;
  muted: string;
  text: string;
  accent: string;
  dark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [practice, setPractice] = useState<PracticeState | null>(null);
  const inner = dark ? 'rounded-lg border border-white/10 bg-black/20' : 'rounded-lg border border-steel bg-stainless-50/80';

  async function loadPractice() {
    if (!practiceEnabled) return;
    setExpanded(true);
    setPractice({ loading: true, dishes: [], clara_prompt: '' });
    try {
      const r = await knowledgeApi.academyPractice(trackId, levelId, mod.id);
      setPractice({
        loading: false,
        dishes: r.practice.dishes,
        clara_prompt: r.practice.clara_prompt,
      });
    } catch {
      setPractice({
        loading: false,
        dishes: [],
        clara_prompt: '',
        error: 'Could not load practice recipes — try again.',
      });
    }
  }

  return (
    <div className={inner + ' p-4 space-y-3'}>
      <div>
        <h4 className={`font-semibold ${dark ? 'text-white' : 'text-chef'}`}>{mod.title}</h4>
        <p className={`text-sm mt-1 ${muted}`}>{mod.summary}</p>
      </div>

      {(mod.time_limit_minutes || mod.show_refs?.length) && (
        <div className={`flex flex-wrap gap-3 text-xs ${muted}`}>
          {mod.time_limit_minutes != null && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {mod.time_limit_minutes} min challenge
            </span>
          )}
          {mod.show_refs?.map((s) => (
            <span key={s} className="inline-flex items-center gap-1">
              <Trophy size={12} /> {s}
            </span>
          ))}
        </div>
      )}

      {mod.teaching && mod.teaching.length > 0 && (
        <ul className={`text-sm space-y-1 ${text}`}>
          {mod.teaching.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className={`${accent} font-bold shrink-0`}>·</span>
              {tip}
            </li>
          ))}
        </ul>
      )}

      {mod.judge_criteria && mod.judge_criteria.length > 0 && (
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${accent} mb-1`}>Judge criteria</p>
          <ul className={`text-xs space-y-1 ${muted}`}>
            {mod.judge_criteria.map((c, i) => (
              <li key={i}>— {c}</li>
            ))}
          </ul>
        </div>
      )}

      {practiceEnabled ? (
        <button
          type="button"
          onClick={() => (expanded && practice && !practice.loading ? setExpanded(false) : loadPractice())}
          className="text-xs font-semibold text-copper-600 hover:text-copper-700 inline-flex items-center gap-1"
        >
          <UtensilsCrossed size={14} />
          {expanded ? 'Hide practice recipes' : 'Practice with pantry-matched recipes'}
        </button>
      ) : (
        <Link
          to="/login"
          className="text-xs font-semibold text-copper-400 hover:text-copper-300 inline-flex items-center gap-1"
        >
          Sign in for recipe suggestions →
        </Link>
      )}

      {expanded && practiceEnabled && practice && (
        <div className="pt-2 space-y-2 border-t border-steel/30">
          {practice.loading && <p className={`text-sm animate-pulse ${muted}`}>Finding recipes for this module…</p>}
          {practice.error && <p className="text-sm text-red-600">{practice.error}</p>}
          {!practice.loading && practice.dishes.length === 0 && !practice.error && (
            <p className={`text-sm ${muted}`}>Add pantry items to unlock matched practice dishes.</p>
          )}
          {practice.dishes.map((d) => (
            <div key={d.id} className={`text-sm ${text} rounded-lg border border-steel/40 p-3`}>
              <p className="font-semibold">{d.title}</p>
              <p className={`text-xs ${muted} mt-0.5`}>
                {d.cuisine_label} · {Math.round(d.pantry_match * 100)}% pantry match
              </p>
            </div>
          ))}
          {practice.clara_prompt && (
            <Link
              to={`/assistant?q=${encodeURIComponent(practice.clara_prompt)}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-copper-600 hover:text-copper-700 mt-1"
            >
              <MessageCircle size={14} /> Ask Clara to coach this module
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
