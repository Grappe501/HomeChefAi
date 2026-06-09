/**
 * Representative brand catalog for ingredient depth enrichment.
 * Not exhaustive — covers national, premium, and store brands users see on receipts.
 */

export type BrandTier = 'national' | 'store' | 'premium' | 'regional';

export interface BrandEntry {
  id: string;
  label: string;
  tier: BrandTier;
}

function b(id: string, label: string, tier: BrandTier = 'national'): BrandEntry {
  return { id, label, tier };
}

/** By wizard-item slug or knowledge slug */
export const WIZARD_ITEM_BRANDS: Record<string, BrandEntry[]> = {
  ketchup: [b('heinz', 'Heinz'), b('frenchs', "French's"), b('hunts', "Hunt's"), b('great_value', 'Great Value', 'store'), b('365', '365 Whole Foods', 'store')],
  mustard: [b('frenchs', "French's"), b('gulden', "Gulden's"), b('grey_poupon', 'Grey Poupon', 'premium'), b('annies', "Annie's", 'premium')],
  mayonnaise: [b('hellmanns', "Hellmann's"), b('dukes', "Duke's", 'regional'), b('kraft', 'Kraft'), b('just', 'Just Mayo', 'premium')],
  soy_sauce: [b('kikkoman', 'Kikkoman'), b('la_choy', 'La Choy'), b('tamari', 'San-J Tamari', 'premium')],
  hot_sauce: [b('tabasco', 'Tabasco'), b('franks', "Frank's RedHot"), b('cholula', 'Cholula'), b('sriracha', 'Huy Fong Sriracha')],
  bbq_sauce: [b('sweet_baby_rays', "Sweet Baby Ray's"), b('stubbs', "Stubb's"), b('kraft', 'Kraft'), b('kingsford', 'Kingsford')],
  olive_oil: [b('bertolli', 'Bertolli'), b('filippo_berio', 'Filippo Berio'), b('california_olive_ranch', 'California Olive Ranch', 'premium')],
  milk: [b('horizon', 'Horizon Organic', 'premium'), b('fairlife', 'Fairlife'), b('great_value', 'Great Value', 'store'), b('kirkland', 'Kirkland', 'store')],
  eggs: [b('egglands_best', "Eggland's Best"), b('vital_farms', 'Vital Farms', 'premium'), b('great_value', 'Great Value', 'store')],
  butter: [b('kerrygold', 'Kerrygold', 'premium'), b('land_o_lakes', 'Land O Lakes'), b('challenge', 'Challenge'), b('plugra', 'Plugrá', 'premium')],
  cheese: [b('kraft', 'Kraft'), b('tillamook', 'Tillamook', 'premium'), b('sargento', 'Sargento'), b('belgioioso', 'BelGioioso', 'premium')],
  yogurt: [b('chobani', 'Chobani'), b('fage', 'Fage', 'premium'), b('yoplait', 'Yoplait'), b('siggi', "Siggi's", 'premium')],
  sour_cream: [b('daisy', 'Daisy'), b('breakstones', 'Breakstone\'s'), b('kraft', 'Kraft')],
  cream_cheese: [b('philadelphia', 'Philadelphia'), b('kraft', 'Kraft')],
  chicken_breast: [b('tyson', 'Tyson'), b('perdue', 'Perdue'), b('bell_evans', 'Bell & Evans', 'premium'), b('kirkland', 'Kirkland', 'store')],
  ground_beef: [b('80_20', '80/20 Ground Beef'), b('grass_fed', 'Grass-Fed', 'premium'), b('great_value', 'Great Value', 'store')],
  bacon: [b('oscar_mayer', 'Oscar Mayer'), b('wright', 'Wright'), b('applewood', 'Applegate', 'premium')],
  sausage: [b('johnsonville', 'Johnsonville'), b('aidells', 'Aidells', 'premium'), b('jimmy_dean', "Jimmy Dean")],
  pasta: [b('barilla', 'Barilla'), b('de_cecco', 'De Cecco', 'premium'), b('muellers', "Mueller's"), b('great_value', 'Great Value', 'store')],
  rice: [b('mahatma', 'Mahatma'), b('uncle_bens', "Ben's Original"), b('lundberg', 'Lundberg', 'premium'), b('kirkland', 'Kirkland', 'store')],
  flour: [b('gold_medal', 'Gold Medal'), b('king_arthur', 'King Arthur', 'premium'), b('pillsbury', 'Pillsbury')],
  sugar: [b('domino', 'Domino'), b('c_h', 'C&H'), b('great_value', 'Great Value', 'store')],
  oats: [b('quaker', 'Quaker'), b('bobs_red_mill', "Bob's Red Mill", 'premium'), b('one_degree', 'One Degree', 'premium')],
  cereal: [b('cheerios', 'Cheerios'), b('frosted_flakes', 'Frosted Flakes'), b('special_k', 'Special K')],
  ice_cream: [b('ben_jerrys', "Ben & Jerry's", 'premium'), b('haagen_dazs', 'Häagen-Dazs', 'premium'), b('talenti', 'Talenti', 'premium'), b('blue_bell', 'Blue Bell', 'regional')],
  frozen_pizza: [b('digiorno', 'DiGiorno'), b('red_barron', 'Red Baron'), b('amy', "Amy's", 'premium'), b('cauliflower', 'Caulipower', 'premium')],
  canned_beans: [b('bushs', "Bush's"), b('goya', 'Goya'), b('365', '365', 'store'), b('great_value', 'Great Value', 'store')],
  canned_tomatoes: [b('mutti', 'Mutti', 'premium'), b('hunt', "Hunt's"), b('san_marzano', 'San Marzano', 'premium'), b('great_value', 'Great Value', 'store')],
  spices: [b('mccormick', 'McCormick'), b('spice_islands', 'Spice Islands', 'premium'), b('morton_bassett', 'Morton & Bassett', 'premium'), b('great_value', 'Great Value', 'store')],
  coffee: [b('starbucks', 'Starbucks'), b('folgers', 'Folgers'), b('maxwell_house', 'Maxwell House'), b('peets', "Peet's", 'premium')],
  peanut_butter: [b('jif', 'Jif'), b('skippy', 'Skippy'), b('justins', "Justin's", 'premium'), b('teddie', 'Teddie', 'regional')],
};

/** Default brands when item-specific list is missing */
export const AISLE_DEFAULT_BRANDS: Record<string, BrandEntry[]> = {
  condiment: WIZARD_ITEM_BRANDS.ketchup,
  dairy: WIZARD_ITEM_BRANDS.milk,
  meat: WIZARD_ITEM_BRANDS.chicken_breast,
  spice: WIZARD_ITEM_BRANDS.spices,
  grain: WIZARD_ITEM_BRANDS.rice,
  baking: WIZARD_ITEM_BRANDS.flour,
  frozen: WIZARD_ITEM_BRANDS.ice_cream,
  produce: [b('organic', 'Organic'), b('conventional', 'Conventional')],
  canned: WIZARD_ITEM_BRANDS.canned_beans,
};

/** Retail aisle by unit category + name hints */
export function inferRetailAisle(wizardItem: string, unitCategory: string): string {
  const n = wizardItem.toLowerCase();
  if (/milk|cheese|yogurt|butter|cream|egg/.test(n)) return 'Dairy & Eggs';
  if (/chicken|beef|bacon|sausage|tofu|deli|turkey|pork|fish/.test(n)) return 'Meat & Seafood';
  if (/frozen|ice cream|pizza/.test(n)) return 'Frozen';
  if (/ketchup|mustard|mayo|sauce|vinegar|oil/.test(n)) return 'Condiments & Sauces';
  if (/powder|spice|paprika|cumin|oregano|basil|salt|pepper|seasoning/.test(n)) return 'Spices & Seasonings';
  if (/rice|pasta|flour|sugar|oats|quinoa|macaroni|spaghetti/.test(n)) return 'Grains & Pasta';
  if (/flour|sugar|baking|vanilla|chocolate|cocoa/.test(n)) return 'Baking';
  if (/banana|apple|onion|tomato|potato|carrot|lettuce|lemon|lime|garlic|celery/.test(n)) return 'Produce';
  if (/can|beans|corn|peas|peach|pineapple/.test(n)) return 'Canned Goods';
  if (unitCategory === 'spice') return 'Spices & Seasonings';
  if (unitCategory === 'volume') return 'Condiments & Sauces';
  return 'Pantry';
}

export function inferStorageLocation(wizardItem: string, unitCategory: string): 'pantry' | 'fridge' | 'freezer' {
  const n = wizardItem.toLowerCase();
  if (/frozen|ice cream/.test(n)) return 'freezer';
  if (/milk|cheese|yogurt|butter|cream|egg|deli|bacon|sausage|produce|banana|apple|onion|tomato|lettuce|lemon|lime|garlic|celery|carrot/.test(n)) return 'fridge';
  if (unitCategory === 'produce') return 'fridge';
  return 'pantry';
}

export function brandsForWizardItem(wizardItem: string): BrandEntry[] {
  const slug = wizardItem.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (WIZARD_ITEM_BRANDS[slug]) return WIZARD_ITEM_BRANDS[slug];
  const n = wizardItem.toLowerCase();
  if (/ketchup/.test(n)) return WIZARD_ITEM_BRANDS.ketchup;
  if (/mustard/.test(n)) return WIZARD_ITEM_BRANDS.mustard;
  if (/mayo/.test(n)) return WIZARD_ITEM_BRANDS.mayonnaise;
  if (/soy/.test(n)) return WIZARD_ITEM_BRANDS.soy_sauce;
  if (/hot sauce/.test(n)) return WIZARD_ITEM_BRANDS.hot_sauce;
  if (/bbq/.test(n)) return WIZARD_ITEM_BRANDS.bbq_sauce;
  if (/olive oil/.test(n)) return WIZARD_ITEM_BRANDS.olive_oil;
  if (/milk/.test(n)) return WIZARD_ITEM_BRANDS.milk;
  if (/egg/.test(n)) return WIZARD_ITEM_BRANDS.eggs;
  if (/butter/.test(n)) return WIZARD_ITEM_BRANDS.butter;
  if (/cheese/.test(n)) return WIZARD_ITEM_BRANDS.cheese;
  if (/yogurt/.test(n)) return WIZARD_ITEM_BRANDS.yogurt;
  if (/chicken/.test(n)) return WIZARD_ITEM_BRANDS.chicken_breast;
  if (/ground beef/.test(n)) return WIZARD_ITEM_BRANDS.ground_beef;
  if (/bacon/.test(n)) return WIZARD_ITEM_BRANDS.bacon;
  if (/sausage/.test(n)) return WIZARD_ITEM_BRANDS.sausage;
  if (/spaghetti|penne|macaroni|pasta/.test(n)) return WIZARD_ITEM_BRANDS.pasta;
  if (/rice/.test(n)) return WIZARD_ITEM_BRANDS.rice;
  if (/flour/.test(n)) return WIZARD_ITEM_BRANDS.flour;
  if (/sugar/.test(n)) return WIZARD_ITEM_BRANDS.sugar;
  if (/oat/.test(n)) return WIZARD_ITEM_BRANDS.oats;
  if (/bean|chickpea|corn|peas|tomato/.test(n) && !/fresh/.test(n)) return WIZARD_ITEM_BRANDS.canned_beans;
  if (/powder|spice|paprika|cumin|oregano|basil|cinnamon|seasoning/.test(n)) return WIZARD_ITEM_BRANDS.spices;
  if (/ice cream/.test(n)) return WIZARD_ITEM_BRANDS.ice_cream;
  if (/frozen pizza/.test(n)) return WIZARD_ITEM_BRANDS.frozen_pizza;
  return AISLE_DEFAULT_BRANDS.produce;
}
