# Logo Concepts 1.0

**Status:** Concept exploration — no final asset committed  
**Date:** June 2026  
**Related:** `BRAND_GUIDE_1_0.md`, `DESIGN_SYSTEM_1_0.md`

---

## Logo requirements

| Requirement | Detail |
|-------------|--------|
| Feel | Professional kitchen · premium · trustworthy |
| Avoid | Cartoon food · script type · Pinterest energy |
| Formats needed | SVG favicon · app icon (512) · horizontal lockup · monogram |
| Colors | Chef Black primary · Copper accent · works on Stainless White |
| Scale | Legible at 16×16 (favicon) and 512×512 (app store) |

---

## Concept exploration

### Option A — Chef knife + brain

**Visual:** Stylized chef knife silhouette with brain/neural pattern in the handle or blade.

| Pros | Cons |
|------|------|
| Communicates intelligence + kitchen | Too obvious |
| Distinctive at a glance | Feels like every "AI cooking" startup |
| Strong favicon potential | Dated quickly |

**Verdict:** ❌ Pass — too on-the-nose, generic AI-food category

---

### Option B — Modern monogram "SC"

**Visual:** Clean geometric monogram — S and C interlocked or stacked.

```
┌─────────┐
│   SC    │  Chef Black on white
│         │  or Copper SC on Chef Black
└─────────┘
```

| Pros | Cons |
|------|------|
| Simple, premium, timeless | Less distinctive in app store |
| Works at any size | Doesn't communicate "food" alone |
| Apple/Porsche energy | Needs wordmark pairing always |
| Easy to implement | |

**Verdict:** ✅ Strong fallback — use as app icon if Option C too complex at small sizes

**Typography:** Custom geometric sans — not script, not serif. Stroke weight matches Lucide icons (2px feel).

---

### Option C — Chef's toque + conversation bubble ⭐ Preferred

**Visual:** Stylized chef's toque merged into a conversation bubble silhouette.

**Meaning:**

| Element | Represents |
|---------|------------|
| Toque | Food · culinary profession · kitchen authority |
| Bubble | Guidance · conversation · intelligence (Clara) |
| Combined | "Your kitchen's intelligent assistant" |

**Construction notes:**

- Single unified shape — not toque floating above bubble
- Minimal line count — readable at 16px
- Rounded rectangle bubble base with toque pleats suggested by 2–3 lines max
- No face, no eyes, no cartoon character

**Color variants:**

| Variant | Usage |
|---------|-------|
| Chef Black on Stainless White | Primary — favicon, nav |
| Copper on White | Marketing accent |
| White on Chef Black | Dark contexts, app splash |

**Verdict:** ✅ **Primary direction** — best balance of food + intelligence + professionalism

---

### Option D — Minimal copper spoon

**Visual:** Elegant single-line spoon silhouette in copper.

| Pros | Cons |
|------|------|
| Recognizable, warm | Less "intelligence" signal |
| Works beautifully as favicon | Common in food apps |
| Copper ties to achievement/XP system | May read as "recipe app" not "OS" |
| Timeless, not trendy | |

**Verdict:** ✅ Strong secondary mark — use for XP, achievements, or sub-brand moments. Not primary logo.

---

## Recommended logo system

### Primary mark

**Option C** — Toque + conversation bubble

### App icon / favicon

**Option C simplified** at 16–32px; fall back to **Option B monogram** if detail lost

### Secondary mark

**Option D** — Copper spoon for gamification, achievements, "special recipe" badges

### Wordmark

```
SousChef
```

| Property | Value |
|----------|-------|
| Typeface | Inter or Manrope Semibold |
| Case | SousChef (camelCase) |
| Color | Chef Black `#111315` |
| Tagline | **Never attached to logo** — marketing only, below or separate |

**Legal name (app store fine print only):** HomeChef AI

---

## Logo don'ts

- No script or handwritten "SousChef"
- No chef hat emoji 🧑‍🍳
- No gradient orange-to-green
- No photorealistic food in logo
- No brain clipart
- No drop shadows on mark
- No outline/sticker style

---

## Favicon spec

| Size | Asset |
|------|-------|
| 16×16 | Simplified toque-bubble or SC monogram |
| 32×32 | Toque-bubble with pleat detail |
| 180×180 | Apple touch icon |
| 512×512 | App store |

**Background:** Stainless White `#F5F7F8` or transparent  
**Foreground:** Chef Black `#111315` with optional 1px copper accent line

Current `public/favicon.svg` — replace during visual redesign phase.

---

## Spacing & clear space

Minimum clear space around mark: **height of toque top**

Minimum size:

| Context | Min width |
|---------|-----------|
| Favicon | 16px |
| Nav logo | 24px mark + wordmark |
| Marketing hero | 48px+ |

---

## File deliverables (when design phase starts)

```
public/
  favicon.svg
  logo-mark.svg          # Toque-bubble only
  logo-wordmark.svg      # SousChef text only
  logo-lockup.svg        # Mark + wordmark horizontal
  logo-monogram.svg      # SC fallback
  icon-spoon.svg         # Copper spoon secondary
  apple-touch-icon.png   # 180×180
  og-image.png           # 1200×630 marketing default
```

---

## Decision log

| Date | Decision |
|------|----------|
| June 2026 | Primary direction: Option C (toque + bubble) |
| June 2026 | Fallback icon: Option B (SC monogram) |
| June 2026 | Secondary mark: Option D (copper spoon) for XP/achievements |
| June 2026 | Rejected: Option A (knife + brain) |
| TBD | Final vector assets + designer handoff |

---

## Next steps

1. Sketch Option C at 16px, 32px, 512px — verify legibility
2. Create SC monogram fallback if C fails at 16px
3. Replace `marketing/favicon.svg` and `public/favicon.svg`
4. Design OG image with logo + "Operating System For Your Kitchen"
5. No logo work blocks Brain 1.0A — parallel track

---

*The mark should feel like it belongs in a Viking showroom, not a Pinterest board.*
