# Inventory Steward — Phase 1

**Version:** 7.1.0  
**Status:** Shipped

## Features

| Feature | Surface | Credits |
|---------|---------|---------|
| `reconcile_inventory` | Clara agent tool | 0 |
| `audit_pantry` | Clara agent tool | 0 (deterministic) |
| `apply_inventory_delta` | Clara → confirm card | 0 |
| `confirm_usage` | Clara → deduct confirm | 0 |
| `predict_expiration` | Scan + receipt normalize | bundled |
| Duplicate merge | Inventory page | 0 |
| Pantry audit API | `inventory-steward` | 1 with AI narrative |

## API

- `GET /.netlify/functions/inventory-steward` — preview (duplicates, low stock, expiring, findings)
- `POST apply-delta` — apply staged pantry changes
- `POST merge` — merge duplicate group
- `POST audit` — `{ use_ai: true }` for narrated audit (1 credit)

## Next: Phase 2

Plan ↔ Cook ↔ Pantry automation — cook-from-plan deduct, supply→pantry, soft reserves.
