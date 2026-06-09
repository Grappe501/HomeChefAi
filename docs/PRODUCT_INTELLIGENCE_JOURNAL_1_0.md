# Product Intelligence Journal 1.0

**Status:** Shipped  
**Date:** June 2026  
**Build window:** After Brain 1.0A · Before Brain 1.0B

---

## Purpose

Capture founder observations while building SousChef — not a generic notes app.

> Steve can be driving, hit record, say "Need dinner party wine pairing engine," and have it searchable in less than 10 seconds.

Observations were trapped in heads, chats, and text files. This makes them **searchable, taggable, and actionable**.

---

## Access

**Admin / founder only.**

- Navigation: Settings → Product Journal
- Route: `/admin/journal`
- Gate: `profiles.is_founder` synced from `FOUNDER_EMAILS` env on auth bootstrap

---

## Note types

| Type | Use |
|------|-----|
| `bug` | Something broken |
| `ux_problem` | Too many taps, confusing flow |
| `insight` | Product learning |
| `future_feature` | Build later |
| `brain_observation` | Brain 1.0A feedback |
| `customer_observation` | Real user behavior |
| `competitive_idea` | Saw elsewhere |

---

## Fields

| Field | Description |
|-------|-------------|
| `note_type` | Entry type |
| `title` | Short headline |
| `body` | Full observation |
| `priority` | low · medium · high |
| `status` | open · in_progress · resolved · archived |
| `related_area` | brain · inventory · receipt · assistant · … |
| `tags` | JSON array for search |
| `linked_feature_id` | FK to feature_requests when converted |
| `brain_version` | e.g. 1.0A |
| `resolved_at` | When closed |

---

## Features (1.0)

- [x] Create / edit / list notes
- [x] Search + filter by type, status, tag, area
- [x] Voice-to-text capture (Web Speech API)
- [x] Convert observation → feature_requests entry
- [x] Export all notes as Markdown
- [x] Supabase-backed + dev store fallback

## Future

- Clara queries journal ("show unresolved Brain notes")
- Build queue integration
- Slack/email ingest

---

## Acceptance test

1. Founder account logs in
2. Settings → Product Journal visible
3. Tap 🎙 Record → speak → title/body populated → Save
4. Search finds note in < 10 seconds
5. Export markdown downloads file
6. Convert to feature request links note

---

## Environment

```
FOUNDER_EMAILS=steve@example.com,other@example.com
```

Comma-separated, case-insensitive. Set in Netlify production env.

---

*Capture the learning process while the product evolves.*
