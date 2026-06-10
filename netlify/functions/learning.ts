import type { Handler } from '@netlify/functions';
import { withCors, jsonResponse, errorResponse, parseBody, requireAuth } from './utils/response.js';
import {
  buildTasteProfileForUser,
  getTasteProfileSummary,
  saveMealOutcome,
  savePreference,
} from './utils/learning/tasteStore.js';
import {
  buildBehaviorProfileForUser,
  getRhythmBundle,
  updateTimeBudget,
} from './utils/learning/behaviorStore.js';
import {
  buildSkillProfileForUser,
  getSkillGrowthBundle,
} from './utils/learning/skillStore.js';
import {
  buildIdentityProfileForUser,
  getIdentityBundle,
} from './utils/learning/identityStore.js';
import { formatSkillProfileForPrompt } from './utils/learning/skillProfileEngine.js';
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

    if (action === 'rhythm') {
      const bundle = await getRhythmBundle(user.id, user.token);
      return jsonResponse(bundle);
    }

    if (action === 'skills') {
      const bundle = await getSkillGrowthBundle(user.id, user.token);
      return jsonResponse(bundle);
    }

    if (action === 'identity') {
      const bundle = await getIdentityBundle(user.id, user.token);
      return jsonResponse(bundle);
    }

    if (action === 'full') {
      const [taste_profile, rhythm, skills, identity] = await Promise.all([
        getTasteProfileSummary(user.id, user.token),
        getRhythmBundle(user.id, user.token),
        getSkillGrowthBundle(user.id, user.token),
        getIdentityBundle(user.id, user.token),
      ]);
      return jsonResponse({
        taste_profile,
        taste_summary: formatTasteProfileForPrompt(taste_profile),
        behavior_profile: rhythm.behavior_profile,
        rhythm_summary: rhythm.summary,
        rhythm_nudges: rhythm.nudges,
        skill_profile: skills.skill_profile,
        skill_summary: skills.summary,
        skill_nudges: skills.nudges,
        identity_profile: identity.identity_profile,
        identity_summary: identity.summary,
        identity_nudges: identity.nudges,
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
      weeknight_max_minutes?: number;
      weekend_project_ok?: boolean;
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
      await buildBehaviorProfileForUser(user.id, user.token);
      await buildSkillProfileForUser(user.id, user.token);
      await buildIdentityProfileForUser(user.id, user.token);
      return jsonResponse(result, 201);
    }

    if (action === 'refresh-profile') {
      const taste_profile = await buildTasteProfileForUser(user.id, user.token);
      return jsonResponse({ taste_profile, summary: formatTasteProfileForPrompt(taste_profile) });
    }

    if (action === 'refresh-rhythm') {
      const behavior_profile = await buildBehaviorProfileForUser(user.id, user.token);
      const bundle = await getRhythmBundle(user.id, user.token);
      return jsonResponse({ behavior_profile, ...bundle });
    }

    if (action === 'refresh-skills') {
      const skill_profile = await buildSkillProfileForUser(user.id, user.token);
      const bundle = await getSkillGrowthBundle(user.id, user.token);
      return jsonResponse({ skill_profile, ...bundle });
    }

    if (action === 'refresh-identity') {
      const identity_profile = await buildIdentityProfileForUser(user.id, user.token);
      const bundle = await getIdentityBundle(user.id, user.token);
      return jsonResponse({ identity_profile, ...bundle });
    }

    if (action === 'set-time-budget') {
      const behavior_profile = await updateTimeBudget(user.id, user.token, {
        weeknight_max_minutes: body?.weeknight_max_minutes,
        weekend_project_ok: body?.weekend_project_ok,
      });
      return jsonResponse({ behavior_profile });
    }

    return errorResponse('Unknown action', 400);
  }

  return errorResponse('Method not allowed', 405);
});
