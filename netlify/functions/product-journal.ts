import { v4 as uuidv4 } from 'uuid';
import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { useDevStore, loadStore, saveStore } from './utils/db.js';
import { getSupabaseUserClient, useDevStore as useDev } from './utils/supabase.js';
import { isFounderUser } from './utils/founder.js';
import type { DevStore } from './utils/types.js';

export interface ProductNote {
  id: string;
  created_by: string;
  note_type: string;
  title: string;
  body: string;
  priority: string;
  status: string;
  related_area?: string | null;
  tags: string[];
  linked_feature_id?: string | null;
  brain_version?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureRequest {
  id: string;
  created_by: string;
  title: string;
  body: string;
  source_note_id?: string | null;
  priority: string;
  status: string;
  related_area?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

type DevStoreJournal = DevStore & {
  product_notes?: ProductNote[];
  feature_requests?: FeatureRequest[];
};

export const handler: Handler = withCors(async (event) => {
  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  const devMode = useDev();
  if (!isFounderUser(user, devMode)) return errorResponse('Founder access only', 403);

  if (event.httpMethod === 'GET') {
    const action = event.queryStringParameters?.action || 'list';
    const q = (event.queryStringParameters?.q || '').trim().toLowerCase();
    const noteType = event.queryStringParameters?.note_type;
    const status = event.queryStringParameters?.status;
    const tag = event.queryStringParameters?.tag;
    const area = event.queryStringParameters?.related_area;

    if (action === 'export') {
      const notes = await loadNotes(user.id, devMode, user.token);
      return jsonResponse({ markdown: notesToMarkdown(notes) });
    }

    let notes = await loadNotes(user.id, devMode, user.token);
    if (noteType) notes = notes.filter((n) => n.note_type === noteType);
    if (status) notes = notes.filter((n) => n.status === status);
    if (area) notes = notes.filter((n) => n.related_area === area);
    if (tag) notes = notes.filter((n) => n.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
    if (q) {
      notes = notes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return jsonResponse({ notes });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      action?: string;
      note_id?: string;
      note_type?: string;
      title?: string;
      body?: string;
      priority?: string;
      status?: string;
      related_area?: string;
      tags?: string[];
      brain_version?: string;
    }>(event);
    if (!body?.action) return errorResponse('action required');

    if (body.action === 'create') {
      if (!body.title?.trim()) return errorResponse('title required');
      const note = buildNote(user.id, body);
      if (devMode) {
        const store = loadStore() as DevStoreJournal;
        if (!store.product_notes) store.product_notes = [];
        store.product_notes.push(note);
        saveStore(store as never);
        return jsonResponse({ note }, 201);
      }
      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data, error } = await db.from('product_notes').insert(rowFromNote(note)).select().single();
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ note: mapNote(data) }, 201);
    }

    if (body.action === 'update' && body.note_id) {
      if (devMode) {
        const store = loadStore() as DevStoreJournal;
        const idx = store.product_notes?.findIndex((n) => n.id === body.note_id) ?? -1;
        if (idx < 0) return errorResponse('Note not found', 404);
        const updated = patchNote(store.product_notes![idx], body);
        store.product_notes![idx] = updated;
        saveStore(store as never);
        return jsonResponse({ note: updated });
      }
      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const updates = patchRow(body);
      const { data, error } = await db.from('product_notes').update(updates).eq('id', body.note_id).select().single();
      if (error) return errorResponse(error.message, 500);
      return jsonResponse({ note: mapNote(data) });
    }

    if (body.action === 'convert' && body.note_id) {
      const notes = await loadNotes(user.id, devMode, user.token);
      const note = notes.find((n) => n.id === body.note_id);
      if (!note) return errorResponse('Note not found', 404);
      if (note.linked_feature_id) return errorResponse('Already converted', 400);

      const feature: FeatureRequest = {
        id: uuidv4(),
        created_by: user.id,
        title: note.title,
        body: note.body,
        source_note_id: note.id,
        priority: note.priority,
        status: 'open',
        related_area: note.related_area,
        tags: [...note.tags, 'from-journal'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (devMode) {
        const store = loadStore() as DevStoreJournal;
        if (!store.feature_requests) store.feature_requests = [];
        store.feature_requests.push(feature);
        const idx = store.product_notes?.findIndex((n) => n.id === note.id) ?? -1;
        if (idx >= 0 && store.product_notes) {
          store.product_notes[idx] = {
            ...store.product_notes[idx],
            linked_feature_id: feature.id,
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          };
        }
        saveStore(store as never);
        return jsonResponse({ feature, note: store.product_notes?.[idx] }, 201);
      }

      if (!user.token) return errorResponse('Missing token', 401);
      const db = getSupabaseUserClient(user.token);
      const { data: feat, error: fErr } = await db
        .from('feature_requests')
        .insert({
          id: feature.id,
          created_by: user.id,
          title: feature.title,
          body: feature.body,
          source_note_id: note.id,
          priority: feature.priority,
          status: feature.status,
          related_area: feature.related_area,
          tags: feature.tags,
        })
        .select()
        .single();
      if (fErr) return errorResponse(fErr.message, 500);
      const { data: updatedNote, error: nErr } = await db
        .from('product_notes')
        .update({ linked_feature_id: feat.id, status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', note.id)
        .select()
        .single();
      if (nErr) return errorResponse(nErr.message, 500);
      return jsonResponse({ feature: feat, note: mapNote(updatedNote) }, 201);
    }

    return errorResponse('Unknown action', 400);
  }

  return errorResponse('Method not allowed', 405);
});

async function loadNotes(userId: string, devMode: boolean, token?: string): Promise<ProductNote[]> {
  if (devMode) {
    const store = loadStore() as DevStoreJournal;
    return store.product_notes ?? [];
  }
  if (!token) return [];
  const db = getSupabaseUserClient(token);
  const { data } = await db.from('product_notes').select('*').order('created_at', { ascending: false });
  return (data ?? []).map(mapNote);
}

function buildNote(userId: string, body: Record<string, unknown>): ProductNote {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    created_by: userId,
    note_type: (body.note_type as string) || 'insight',
    title: (body.title as string).trim(),
    body: ((body.body as string) || '').trim(),
    priority: (body.priority as string) || 'medium',
    status: 'open',
    related_area: (body.related_area as string) || null,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
    brain_version: (body.brain_version as string) || '1.0A',
    created_at: now,
    updated_at: now,
  };
}

function patchNote(note: ProductNote, body: Record<string, unknown>): ProductNote {
  const status = body.status as string | undefined;
  return {
    ...note,
    ...(body.title !== undefined && { title: (body.title as string).trim() }),
    ...(body.body !== undefined && { body: (body.body as string).trim() }),
    ...(body.note_type !== undefined && { note_type: body.note_type as string }),
    ...(body.priority !== undefined && { priority: body.priority as string }),
    ...(status !== undefined && {
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    }),
    ...(body.related_area !== undefined && { related_area: body.related_area as string }),
    ...(body.tags !== undefined && { tags: body.tags as string[] }),
    updated_at: new Date().toISOString(),
  };
}

function patchRow(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = (body.title as string).trim();
  if (body.body !== undefined) updates.body = (body.body as string).trim();
  if (body.note_type !== undefined) updates.note_type = body.note_type;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.related_area !== undefined) updates.related_area = body.related_area;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.status !== undefined) {
    updates.status = body.status;
    updates.resolved_at = body.status === 'resolved' ? new Date().toISOString() : null;
  }
  return updates;
}

function rowFromNote(note: ProductNote) {
  return {
    id: note.id,
    created_by: note.created_by,
    note_type: note.note_type,
    title: note.title,
    body: note.body,
    priority: note.priority,
    status: note.status,
    related_area: note.related_area,
    tags: note.tags,
    brain_version: note.brain_version,
  };
}

function mapNote(row: Record<string, unknown>): ProductNote {
  return {
    id: row.id as string,
    created_by: row.created_by as string,
    note_type: row.note_type as string,
    title: row.title as string,
    body: (row.body as string) || '',
    priority: row.priority as string,
    status: row.status as string,
    related_area: row.related_area as string | null,
    tags: (row.tags as string[]) || [],
    linked_feature_id: row.linked_feature_id as string | null,
    brain_version: row.brain_version as string | null,
    resolved_at: row.resolved_at as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function notesToMarkdown(notes: ProductNote[]): string {
  const lines = ['# SousChef Product Intelligence Journal', '', `Exported: ${new Date().toISOString()}`, ''];
  for (const n of notes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())) {
    lines.push(`## ${n.title}`, '');
    lines.push(`- **Type:** ${n.note_type}`);
    lines.push(`- **Status:** ${n.status} · **Priority:** ${n.priority}`);
    if (n.related_area) lines.push(`- **Area:** ${n.related_area}`);
    if (n.tags.length) lines.push(`- **Tags:** ${n.tags.join(', ')}`);
    if (n.brain_version) lines.push(`- **Brain:** ${n.brain_version}`);
    lines.push(`- **Date:** ${n.created_at}`, '');
    lines.push(n.body || '_No body_', '');
    lines.push('---', '');
  }
  return lines.join('\n');
}
