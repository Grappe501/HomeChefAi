/** Kitchen Academy learning paths — structured technique + flavor journeys */

export const ACADEMY_PATHS = [
  {
    id: 'path.flavor_foundations',
    title: 'Flavor Foundations',
    summary: 'Learn salt, acid, fat, heat — and how to balance a plate.',
    steps: [
      'flavor_profile.umami',
      'flavor_profile.bright_acid',
      'flavor_profile.rich_creamy',
      'technique.layer_season',
      'technique.deglaze',
    ],
    teaching: [
      'Salt at every stage — lightly early, adjust at the end.',
      'Acid is a finish move: lemon, vinegar, pickle brine.',
      'Fat carries flavor; without acid, dishes taste heavy.',
    ],
  },
  {
    id: 'path.heat_mastery',
    title: 'Heat Mastery',
    summary: 'From sear to braise — control temperature and timing.',
    steps: [
      'technique.sear',
      'technique.saute',
      'technique.roast',
      'technique.braise',
      'technique.rest',
    ],
    teaching: [
      'Dry surface + hot pan = Maillard crust.',
      'Low moist heat transforms tough cuts over time.',
      'Resting meat is not optional — juices need to settle.',
    ],
  },
  {
    id: 'path.global_aromatics',
    title: 'Global Aromatics',
    summary: 'Build flavor bases from mirepoix to sofrito to curry paste.',
    steps: [
      'technique.mirepoix',
      'technique.bloom_spices',
      'culture.cuisine.indian',
      'culture.cuisine.mexican',
      'culture.cuisine.thai',
    ],
    teaching: [
      'Every cuisine has an aromatic base — learn the pattern, swap the ingredients.',
      'Bloom spices in fat before adding liquid.',
      'Cultural respect: learn the why, not just the recipe.',
    ],
  },
  {
    id: 'path.sauce_science',
    title: 'Sauce Science',
    summary: 'Roux, emulsion, reduction — sauces that cling and shine.',
    steps: [
      'technique.roux',
      'technique.stock',
      'technique.reduce',
      'technique.emulsion',
      'technique.mount_butter',
    ],
    teaching: [
      'Roux color determines sauce personality — blond vs. chocolate brown.',
      'Reduce before adding cream or butter.',
      'Broken emulsion? Drop of water while whisking off heat.',
    ],
  },
  {
    id: 'path.shop_smarter',
    title: 'Shop Smarter',
    summary: 'Farmers markets, CSAs, and grocery strategy for better meals.',
    steps: [
      'food_source.farmers_market',
      'food_source.csa',
      'food_source.seasonal_produce',
      'food_source.walmart',
      'food_source.whole_foods',
    ],
    teaching: [
      'Buy seasonal first — plan meals around what is peak.',
      'Use chain stores for staples; local for peak produce and proteins.',
      'Set preferred store in profile so Clara tailors shopping tips.',
    ],
  },
  {
    id: 'path.preservation',
    title: 'Preserve & Extend',
    summary: 'Pickle, ferment, brine — flavor depth and less waste.',
    steps: [
      'technique.pickle',
      'technique.brine',
      'technique.ferment',
      'flavor_profile.fermented_depth',
      'technique.cure',
    ],
    teaching: [
      'Quick pickles add acid and crunch in 30 minutes.',
      'Fermentation is controlled spoilage — salt is the guardrail.',
      'Preserving extends seasonal bounty into winter cooking.',
    ],
  },
];
