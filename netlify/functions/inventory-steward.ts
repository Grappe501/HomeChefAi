import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import { chargeCredits, quotaErrorResponse } from './utils/quotas.js';
import {
  applyInventoryDeltas,
  buildStewardPreviewForUser,
  mergeDuplicateGroup,
  narrateAudit,
} from './utils/inventory/stewardEngine.js';
import type { InventoryDelta } from '../../src/types/inventorySteward.js';
import { loadAssistantSession } from './utils/assistantContext.js';

export const handler: Handler = withCors(async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({});

  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const preview = await buildStewardPreviewForUser(user.id, user.token);
    return jsonResponse({ preview });
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      action?: string;
      deltas?: InventoryDelta[];
      keep_id?: string;
      merge_ids?: string[];
      use_ai?: boolean;
    }>(event);

    const action = body?.action ?? 'preview';

    if (action === 'preview') {
      const preview = await buildStewardPreviewForUser(user.id, user.token);
      return jsonResponse({ preview });
    }

    if (action === 'apply-delta') {
      if (!body?.deltas?.length) return errorResponse('deltas required', 400);
      const result = await applyInventoryDeltas(user.id, user.token, body.deltas);
      return jsonResponse(result);
    }

    if (action === 'merge') {
      if (!body?.keep_id || !body.merge_ids?.length) return errorResponse('keep_id and merge_ids required', 400);
      const result = await mergeDuplicateGroup(user.id, user.token, body.keep_id, body.merge_ids);
      return jsonResponse(result);
    }

    if (action === 'audit') {
      const preview = await buildStewardPreviewForUser(user.id, user.token);
      let narrative: string | undefined;
      let credit_cost = 0;
      let credits_remaining: number | undefined;

      if (body?.use_ai) {
        const credit = await chargeCredits(user.id, 'inventory_audit');
        if (!credit.allowed) {
          return quotaErrorResponse(credit.limits, credit.usage, credit.status);
        }
        credit_cost = credit.cost;
        credits_remaining = credit.status.remaining;
        const session = await loadAssistantSession(event);
        const assistantName = 'error' in session ? 'Clara' : session.session.profile.assistant_name;
        narrative = await narrateAudit(preview.findings, assistantName);
      }

      return jsonResponse({
        preview,
        narrative: narrative ?? preview.findings.map((f) => `${f.title}: ${f.message}`).join('\n'),
        credit_cost,
        credits_remaining,
      });
    }

    return errorResponse('Unknown action', 400);
  }

  return errorResponse('Method not allowed', 405);
});
