import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, MicOff, Download, Search, ArrowLeft, Plus, GitBranchPlus } from 'lucide-react';
import { productJournalApi } from '@/lib/api';
import { useSpeechRecognition } from '@/hooks/useSpeech';
import { useToast } from '@/hooks/useToast';
import {
  NOTE_TYPES,
  NOTE_STATUSES,
  RELATED_AREAS,
  type ProductNote,
  type ProductNoteType,
  type NotePriority,
} from '@/types/productJournal';

export default function ProductJournal() {
  const toast = useToast();
  const [notes, setNotes] = useState<ProductNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [noteType, setNoteType] = useState<ProductNoteType>('insight');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<NotePriority>('medium');
  const [relatedArea, setRelatedArea] = useState('general');
  const [tagsInput, setTagsInput] = useState('');

  const handleVoiceResult = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setShowForm(true);
      if (!title.trim()) {
        setTitle(trimmed.split(/\s+/).slice(0, 8).join(' '));
        setBody(trimmed);
      } else {
        setBody((b) => (b ? `${b} ${trimmed}` : trimmed));
      }
      toast.success('Voice captured');
    },
    [title, toast]
  );

  const { listening, supported, start, stop } = useSpeechRecognition(handleVoiceResult);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await productJournalApi.list({
        q: search || undefined,
        note_type: filterType || undefined,
        status: filterStatus || undefined,
      });
      setNotes(r.notes);
      setForbidden(false);
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 403) {
        setForbidden(true);
      } else {
        toast.error('Could not load journal');
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterStatus, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitle('');
    setBody('');
    setNoteType('insight');
    setPriority('medium');
    setRelatedArea('general');
    setTagsInput('');
    setShowForm(false);
  };

  const saveNote = async () => {
    if (!title.trim()) {
      toast.error('Title required');
      return;
    }
    setSaving(true);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await productJournalApi.create({
        note_type: noteType,
        title: title.trim(),
        body: body.trim(),
        priority,
        related_area: relatedArea,
        tags,
        brain_version: '1.0A',
      });
      toast.success('Observation saved');
      resetForm();
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const recordVoice = () => {
    if (listening) {
      stop();
      return;
    }
    setShowForm(true);
    start();
  };

  const exportMd = async () => {
    try {
      const { markdown } = await productJournalApi.exportMarkdown();
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `souschef-journal-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const convertNote = async (id: string) => {
    try {
      await productJournalApi.convert(id);
      toast.success('Converted to feature request');
      load();
    } catch {
      toast.error('Convert failed');
    }
  };

  const resolveNote = async (note: ProductNote) => {
    try {
      await productJournalApi.update(note.id, { status: 'resolved' });
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  if (forbidden) {
    return (
      <div className="space-y-4">
        <Link to="/settings" className="text-copper-600 text-sm flex items-center gap-1"><ArrowLeft size={16} /> Settings</Link>
        <div className="card">
          <p className="text-chef-subtle">Founder access only. Your account is not in FOUNDER_EMAILS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link to="/settings" className="text-copper-600 text-sm flex items-center gap-1 mb-1"><ArrowLeft size={16} /> Settings</Link>
          <h2 className="font-semibold text-lg">Product Journal</h2>
          <p className="text-xs text-chef-subtle">Founder intelligence · voice-first</p>
        </div>
        <button type="button" onClick={exportMd} className="btn-secondary text-sm py-2 px-3 min-h-0" title="Export markdown">
          <Download size={18} />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={recordVoice}
          disabled={!supported}
          className={`flex-1 btn-primary ${listening ? 'bg-red-600 hover:bg-red-700' : ''}`}
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
          {listening ? 'Stop' : 'Record Observation'}
        </button>
        <button type="button" onClick={() => setShowForm(!showForm)} className="btn-secondary px-4">
          <Plus size={20} />
        </button>
      </div>

      {!supported && (
        <p className="text-xs text-amber-700">Voice capture needs Chrome/Safari on mobile or desktop.</p>
      )}

      {showForm && (
        <section className="card space-y-3">
          <h3 className="font-semibold text-sm">New observation</h3>
          <select value={noteType} onChange={(e) => setNoteType(e.target.value as ProductNoteType)} className="input-field text-base">
            {NOTE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input-field" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Details…" rows={4} className="input-field text-base min-h-[100px]" />
          <div className="grid grid-cols-2 gap-2">
            <select value={priority} onChange={(e) => setPriority(e.target.value as NotePriority)} className="input-field text-base">
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <select value={relatedArea} onChange={(e) => setRelatedArea(e.target.value)} className="input-field text-base">
              {RELATED_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags (comma-separated)" className="input-field" />
          <div className="flex gap-2">
            <button type="button" onClick={saveNote} disabled={saving} className="btn-primary flex-1">Save</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </section>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-dark" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="input-field pl-9 text-base"
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field w-auto text-sm min-w-[120px]">
          <option value="">All types</option>
          {NOTE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm min-w-[100px]">
          <option value="">All status</option>
          {NOTE_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading && <div className="card text-sm text-chef-subtle">Loading…</div>}

      {!loading && notes.length === 0 && (
        <div className="card text-sm text-chef-subtle">No observations yet. Hit record or + to capture your first note.</div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <article key={note.id} className="card space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="text-xs text-chef-subtle uppercase tracking-wide">
                  {NOTE_TYPES.find((t) => t.id === note.note_type)?.label || note.note_type}
                  {note.related_area ? ` · ${note.related_area}` : ''}
                </p>
                <h3 className="font-semibold text-chef">{note.title}</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-lg shrink-0 ${
                note.priority === 'high' ? 'bg-red-100 text-red-800' :
                note.priority === 'low' ? 'bg-stainless-200 text-chef-subtle' :
                'bg-amber-100 text-amber-800'
              }`}>{note.priority}</span>
            </div>
            {note.body && <p className="text-sm text-chef-subtle whitespace-pre-wrap">{note.body}</p>}
            {note.tags.length > 0 && (
              <p className="text-xs text-chef-subtle">{note.tags.map((t) => `#${t}`).join(' ')}</p>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-steel-dark">{new Date(note.created_at).toLocaleString()} · {note.status}</span>
              <div className="flex gap-2">
                {note.status === 'open' && (
                  <button type="button" onClick={() => resolveNote(note)} className="text-xs text-chef-subtle font-medium">Resolve</button>
                )}
                {!note.linked_feature_id && (
                  <button type="button" onClick={() => convertNote(note.id)} className="text-xs text-copper-600 font-medium flex items-center gap-0.5">
                    <GitBranchPlus size={14} /> Build item
                  </button>
                )}
                {note.linked_feature_id && (
                  <span className="text-xs text-chef-subtle">→ feature request</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
