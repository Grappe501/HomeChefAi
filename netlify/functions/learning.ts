import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import {
  buildTasteProfileForUser,
  getTasteProfileSummary,
  saveMealOutcome,
  savePreference,
} from './utils/learning/tasteStore.js';
import type { MealOutcomeRating, PendingPreference, PreferenceKind } from '../../src/types/tasteLearning.js';
import { formatTasteProfileForPrompt } from './utils/learning/tasteProfileEngine.js';

export const handler: Handler = withCors(async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({});

  const user = await requireAuth(event);
  if (!user) return errorResponse('Unauthorized', 401);

  if (event.httpMethod === 'GET') {
    const action = event.queryStringParameters?.action ?? 'profile';
    if (action === 'profile') {
      const taste_profile = await getTasteProfileSummary(user.id, user.token);
      return jsonResponse({
        taste_profile,
        summary: formatTasteProfileForPrompt(taste_profile),
      });
    }
    return errorResponse('Unknown action', 400);
  }

  if (event.httpMethod === 'POST') {
    const body = parseBody<{
      action?: string;
      subject?: string;
      kind?: PreferenceKind;
      reason?: string;
      member_label?: string;
      source?: PendingPreference & { source?: 'chat' | 'cook_log' | 'meal_plan' | 'onboarding' | 'manual' };
      meal_name?: string;
      rating?: MealOutcomeRating;
      usage_log_id?: string;
      notes?: string;
    }>(event);

    const action = body?.action ?? 'save-preference';

    if (action === 'save-preference') {
      if (!body?.subject?.trim()) return errorResponse('subject required', 400);
      if (!body.kind || !['avoid', 'prefer', 'allergy', 'household'].includes(body.kind)) {
        return errorResponse('kind must be avoid, prefer, allergy, or household', 400);
      }
      const result = await savePreference(
        user.id,
        user.token,
        {
          subject: body.subject,
          kind: body.kind,
          reason: body.reason,
          member_label: body.member_label,
        },
        undefined,
      );
      return jsonResponse(result, 201);
    }

    if (action === 'rate-meal') {
      if (!body?.meal_name?.trim()) return errorResponse('meal_name required', 400);
      if (!body.rating || !['loved', 'ok', 'never_again', 'too_hard', 'too_long'].includes(body.rating)) {
        return errorResponse('rating required', 400);
      }
      const result = await saveMealOutcome(user.id, user.token, {
        meal_name: body.meal_name,
        rating: body.rating,
        usage_log_id: body.usage_log_id,
        notes: body.notes,
      });
      return jsonResponse(result, 201);
    }

    if (action === 'refresh-profile') {
      const taste_profile = await buildTasteProfileForUser(user.id, user.token);
      return jsonResponse({ taste_profile, summary: formatTasteProfileForPrompt(taste_profile) });
    }

    return errorResponse('Unknown action', 400);
  }

  return errorResponse('Method not allowed', 405);
});
