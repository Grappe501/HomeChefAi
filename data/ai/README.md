# AI Knowledge Registry

**Initiative:** SOUSCHEF-AI-FOUNDATION-1.0 · Layer 1  
**Spec:** [develop_notes/AI_ARCHITECTURE_MAP_1_0.md](../develop_notes/AI_ARCHITECTURE_MAP_1_0.md)

Structured culinary knowledge — **not prompts**. Clara queries this at runtime.

---

## Directory layout

```text
data/ai/
├── ingredients/       # Food nodes (extends FOOD_TAXONOMY)
├── techniques/        # roux, sear, braise…
├── flavor_profiles/   # cajun, umami-forward…
├── substitutions/     # directed edges between ingredient ids
├── cuisines/          # regional patterns, staple bundles
├── food_science/      # maillard, emulsion, gluten…
├── nutrition/         # reference data (not medical advice)
├── meal_patterns/     # leftover_lunch, easy_night, rotating_breakfast
├── hosting/           # potluck, dinner_party, game_day
├── culture/           # holiday, tradition templates
└── traditions/        # legacy recipe story patterns
```

---

## Node file format

One JSON file per node. Id matches filename path:

`ingredients/paprika.json` → `"id": "ingredient.paprika"`

See architecture map for full schema.

---

## Seed priority (S1)

| Node | Why |
|------|-----|
| `ingredients/paprika.json` | Variants, substitutes, pairings — spec example |
| `ingredients/chicken.json` | Reasoning engine demo |
| `ingredients/flour.json` | Baking + taxonomy bridge |
| `techniques/roux.json` | Southern/Cajun identity |
| `meal_patterns/leftover_lunch.json` | Planner realism rule |
| `cuisines/cajun.json` | Style override + staples |
| `substitutions/mozzarella_provolone.json` | Substitution edge example |

---

## Relationship to app code

| App module | Registry use |
|------------|--------------|
| `src/types/foodTaxonomy.ts` | Importer source for ingredient families |
| `netlify/functions/knowledge.ts` | Read API (S2) |
| `meals.ts` | Reasoning + substitutions |
| `assistant.ts` | Expert evidence citations |

---

## Conventions

- ids: lowercase dot-separated (`ingredient.paprika.smoked`)
- All nodes include `sources[]` for auditability
- No household PII in this tree — global kitchen facts only
- Version field optional until registry hits 100+ nodes

---

*Build knowledge once. Every feature queries the same graph.*
