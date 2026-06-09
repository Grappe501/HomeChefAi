/** Kitchen Academy track builders — module and level helpers */

export function mod(id, title, summary, opts = {}) {
  return {
    id,
    title,
    summary,
    techniques: opts.techniques ?? [],
    flavors: opts.flavors ?? [],
    ingredients: opts.ingredients ?? [],
    spices: opts.spices ?? [],
    cultures: opts.cultures ?? [],
    practice_query: opts.practice_query ?? '',
    teaching: opts.teaching ?? [],
    ...(opts.time_limit_minutes != null ? { time_limit_minutes: opts.time_limit_minutes } : {}),
    ...(opts.judge_criteria ? { judge_criteria: opts.judge_criteria } : {}),
    ...(opts.show_refs ? { show_refs: opts.show_refs } : {}),
  };
}

export function level(id, rank, title, description, modules) {
  return { id, rank, title, description, modules };
}
