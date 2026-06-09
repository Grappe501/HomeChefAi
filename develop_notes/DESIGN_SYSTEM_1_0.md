# Design System 1.0

**Status:** Documentation only — tokens defined, not yet applied in code  
**Date:** June 2026  
**Related:** `BRAND_GUIDE_1_0.md`, `src/index.css`, `tailwind.config.js`

> **Rule:** Lock tokens here before major UI redesign. Brain 1.0A can ship on current styles; visual migration follows Brain validation.

---

## Design philosophy

**Apple + Notion + Michelin Guide**

- Dashboard-first, not feed-first
- Data and numbers are first-class citizens
- Cards are structural, not decorative
- Motion is subtle; never bouncy or playful
- Touch targets remain accessible (52px minimum — keep from V3.1)

---

## Color tokens

### Core palette

```css
/* Primary backgrounds */
--color-stainless-white:   #F5F7F8;
--color-stainless-50:      #FAFBFC;
--color-stainless-100:     #F5F7F8;

/* Text & authority */
--color-chef-black:          #111315;
--color-chef-black-muted:    #3A3F44;
--color-chef-black-subtle:   #6B7280;

/* Surfaces & borders */
--color-brushed-steel:       #D7DCE0;
--color-brushed-steel-light: #E8EBED;
--color-brushed-steel-dark:  #B8BFC6;

/* Accents */
--color-copper:              #B87333;
--color-copper-light:        #D4956A;
--color-copper-dark:         #8F5A28;
--color-copper-muted:        #F5EDE4;   /* backgrounds only */

--color-sage:                #66785F;
--color-sage-light:          #8A9A84;
--color-sage-dark:           #4A5A44;
--color-sage-muted:          #EEF2ED;   /* success backgrounds */

--color-burgundy:            #5E1F2D;
--color-burgundy-light:      #7A3344;
--color-burgundy-dark:       #451722;
--color-burgundy-muted:      #F3EAEC;   /* premium backgrounds */
```

### Semantic mapping

| Token | Usage |
|-------|-------|
| `stainless-white` | Page background, card fill |
| `chef-black` | Primary text, headings |
| `brushed-steel` | Borders, dividers, disabled surfaces |
| `copper` | Primary CTA, XP, achievements, ratings, active states |
| `sage` | Success, local food, garden, fresh/grow badges |
| `burgundy` | Wine, dinner party, premium tier, special occasions |

### Accent usage rules

| Accent | When | When NOT |
|--------|------|----------|
| **Copper** | Primary buttons, XP bars, achievement unlocks, Plate Score highlights | Body text, large backgrounds, every icon |
| **Sage** | Success toasts, "buy local" nudges, inventory freshness, garden mode | Primary CTAs, error states |
| **Burgundy** | Dinner party mode, wine pairing, Family tier badges, Experience Engine | General UI chrome |

**Ratio guideline:** 85% neutral (white/black/steel) · 10% sage · 5% copper/burgundy combined

---

## Tailwind migration map

Current (`tailwind.config.js`) → Target:

| Current | Target | Notes |
|---------|--------|-------|
| `chef-500: #ee7712` | `copper-500: #B87333` | Rename palette |
| `sage-500: #527856` | `sage-500: #66785F` | Muted, less "health app" |
| `sage-50: #f4f7f4` | `stainless-100: #F5F7F8` | Neutral background |
| `font-display: Georgia` | Remove | Use sans throughout |
| `font-sans: system-ui` | `Inter, Manrope, system-ui` | Add web font |

### Proposed Tailwind structure (future)

```js
colors: {
  stainless: { 50: '#FAFBFC', 100: '#F5F7F8', 200: '#E8EBED' },
  chef: { DEFAULT: '#111315', muted: '#3A3F44', subtle: '#6B7280' },
  steel: { DEFAULT: '#D7DCE0', light: '#E8EBED', dark: '#B8BFC6' },
  copper: { 50: '#F5EDE4', 500: '#B87333', 600: '#8F5A28', 700: '#6B4420' },
  sage: { 50: '#EEF2ED', 500: '#66785F', 600: '#4A5A44', 700: '#3A4736' },
  burgundy: { 50: '#F3EAEC', 500: '#5E1F2D', 600: '#451722', 700: '#351019' },
}
```

---

## Typography

### Font stack (locked)

```css
--font-sans: 'Inter', 'Manrope', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
```

**Recommendation:** Inter for body + headings (single family, variable weight). Manrope as alternative if Inter feels too generic.

### Scale

| Token | Size | Weight | Line height | Usage |
|-------|------|--------|-------------|-------|
| `text-display` | 32px / 2rem | 700 | 1.2 | Page titles |
| `text-h1` | 28px / 1.75rem | 700 | 1.25 | Section headers |
| `text-h2` | 22px / 1.375rem | 600 | 1.3 | Card titles |
| `text-h3` | 18px / 1.125rem | 600 | 1.4 | Subsections |
| `text-body` | 16px / 1rem | 400 | 1.5 | Body copy |
| `text-body-lg` | 18px / 1.125rem | 400 | 1.5 | Onboarding, assistant |
| `text-caption` | 14px / 0.875rem | 500 | 1.4 | Labels, metadata |
| `text-metric` | 28–36px | 700 | 1.1 | Dashboard numbers — tabular-nums |
| `text-metric-sm` | 20px | 600 | 1.2 | Secondary metrics |

### Number formatting

- Always `font-variant-numeric: tabular-nums` on metrics
- Dashboard numbers: Chef Black, bold, no color unless semantic (copper for XP, sage for savings)

---

## Spacing system

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight inline |
| `space-2` | 8px | Icon gaps |
| `space-3` | 12px | Compact padding |
| `space-4` | 16px | Card padding (mobile) |
| `space-5` | 20px | Card padding (desktop) |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Page section spacing |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Hero spacing |

### Layout widths

| Token | Value |
|-------|-------|
| `max-content` | 680px — forms, onboarding |
| `max-dashboard` | 960px — main app |
| `max-marketing` | 1120px — marketing site |

---

## Card system

### Standard card

```
Background:    stainless-white (#F5F7F8) or white
Border:        1px brushed-steel (#D7DCE0)
Radius:        12px (mobile) · 16px (desktop)
Shadow:        0 1px 3px rgba(17, 19, 21, 0.06)
Padding:       16px mobile · 20px desktop
```

### Elevated card (Brain insights, featured)

```
Shadow:        0 2px 8px rgba(17, 19, 21, 0.08)
Border-left:   3px copper (insights) · sage (success) · burgundy (experience)
```

### Metric card (dashboard)

```
Background:    white
Border:        1px brushed-steel
Number:        text-metric, chef-black, tabular-nums
Label:         text-caption, chef-black-subtle
Accent bar:    2px bottom border — copper | sage | burgundy by category
```

**Not:** floating cartoon cards · heavy drop shadows · gradient backgrounds

---

## Button system

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| **Primary** | copper-500 | white | none | Main actions |
| **Secondary** | white | chef-black | 1px steel | Cancel, alternate |
| **Ghost** | transparent | chef-black-muted | none | Tertiary, nav |
| **Premium** | burgundy-500 | white | none | Family tier, dinner party |
| **Success** | sage-500 | white | none | Confirm, approve |

### Sizing (keep V3.1 accessibility)

| Size | Height | Padding | Font |
|------|--------|---------|------|
| Default | 52px min | 14px 24px | 16px semibold |
| Compact | 44px min | 10px 16px | 14px semibold |
| Icon | 48×48 min | — | — |

### Radius

- Buttons: `12px` (not pill — too playful)
- Icon buttons: `12px` (not full circle unless avatar)

---

## Input system

```
Background:     white
Border:         2px brushed-steel
Focus border:   2px copper
Radius:         12px
Min height:     52px
Font:           16px (prevent iOS zoom)
Placeholder:    chef-black-subtle
```

---

## Iconography

### Style

- **Line icons** — Lucide (already in use)
- Stroke: 1.5–2px
- Color: chef-black or chef-black-muted
- Accent icons only: copper for achievements, sage for local/garden, burgundy for wine/party

### Avoid

- Filled colorful food emoji as icons
- Cartoon vegetable illustrations
- 3D or skeuomorphic food icons

### Icon + label pattern

Dashboard and nav always pair icon with text label on mobile bottom nav.

---

## Shadow system

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-xs` | `0 1px 2px rgba(17,19,21,0.04)` | Subtle lift |
| `shadow-sm` | `0 1px 3px rgba(17,19,21,0.06)` | Cards |
| `shadow-md` | `0 2px 8px rgba(17,19,21,0.08)` | Elevated cards, dropdowns |
| `shadow-lg` | `0 4px 16px rgba(17,19,21,0.10)` | Modals only |

**No** colored shadows. **No** orange/copper glow on buttons.

---

## Motion

| Pattern | Duration | Easing |
|---------|----------|--------|
| Hover color | 150ms | ease |
| Card press | 100ms | ease — scale 0.98 max |
| Page transition | 200ms | ease-out |
| Toast enter | 250ms | ease-out |
| Achievement unlock | 400ms | ease-out — subtle, no confetti |

**Avoid:** bounce · spring · playful wiggle

---

## Assistant visual identity (Sous Chef)

Default name: **Clara** (renameable). Role: **Sous Chef** — not chatbot, not mascot.

| Element | Treatment |
|---------|-----------|
| Avatar | Minimal — copper monogram or toque-bubble icon (see logo concepts) |
| Greeting | "Good evening, Chef. I'm Clara, your Sous Chef." |
| Message bubble | White card, 1px steel border, 12px radius |
| User bubble | stainless-100 background — user is Chef |
| Insight cards | Left copper accent bar, metric-forward |
| Typing indicator | Three subtle dots — no animated mascot |

---

## Component inventory (redesign scope)

| Component | Priority | Notes |
|-----------|----------|-------|
| Dashboard layout | P0 | Command center grid |
| Metric cards | P0 | Outcome numbers |
| Brain insight cards | P0 | New in 1.0A |
| Navigation | P0 | Bottom nav + header |
| Buttons / inputs | P1 | Token swap |
| Toast system | P1 | Already built — restyle |
| Recipe cards | P2 | Authorship-forward |
| Cookbook cards | P2 | Lineage display |
| XP / achievements | P2 | Copper accent |
| Dinner party UI | P3 | Burgundy accent |
| Marketing site | P3 | After Brain 1.0A |

---

## Dark mode (future — not v1.0)

When added:

| Light | Dark |
|-------|------|
| stainless-white bg | chef-black bg |
| chef-black text | stainless-white text |
| white cards | `#1A1D21` cards |
| copper/sage/burgundy | Same hues, slightly desaturated |

Not in scope for initial redesign.

---

## Implementation phases

| Phase | When | Work |
|-------|------|------|
| **0 (now)** | Pre-Brain 1.0A | This document — tokens locked |
| **1** | Brain 1.0A | New `/brain` page uses new tokens |
| **2** | Post-Brain validation | Tailwind config migration |
| **3** | Marketing rebuild | Full site + app shell |
| **4** | Cookbook Social | Recipe/cookbook components |

---

## CSS component classes (target)

Future replacement for `src/index.css`:

```css
.card { @apply bg-white rounded-xl border border-steel shadow-sm p-4 md:p-5; }
.card-elevated { @apply card shadow-md border-l-[3px] border-l-copper-500; }
.btn-primary { @apply bg-copper-500 hover:bg-copper-600 text-white font-semibold rounded-xl min-h-[52px]; }
.btn-secondary { @apply bg-white border border-steel text-chef font-semibold rounded-xl min-h-[52px]; }
.metric-value { @apply text-metric font-bold text-chef tabular-nums; }
.insight-card { @apply card border-l-[3px] border-l-copper-500; }
.success-badge { @apply bg-sage-50 text-sage-600 text-caption font-medium px-2 py-1 rounded-lg; }
.premium-badge { @apply bg-burgundy-50 text-burgundy-600 text-caption font-medium px-2 py-1 rounded-lg; }
```

---

*Tokens before pixels. Command center before cookbook cute.*
