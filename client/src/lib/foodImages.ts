// Lightweight client image resolver — uses API imageUrl first, local fallback if missing.

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=480&h=360&fit=crop&q=80`;

const EXACT: Record<string, string> = {
  'Pesto Eggs on Toast': IMG('1482049016688-2ed3cb1a218b'),
  'Eggs Kejriwal': IMG('1525351484163-7529414344d8'),
  'Miso Scrambled Eggs': IMG('1582169294851-6a3c6c0c8c0e'),
  'Khao Soi Eggs Benedict': IMG('1608039829572-7854f212c649'),
  'Akuri Style Bhurji': IMG('1525351484163-7529414344d8'),
  'Big Brekkie': IMG('1533089860892-a7c6f0a88666'),
  'Beetroot Avocado Toast': IMG('1541519227359-08fa5d50c44d'),
  'Skillet Croque Monsieur': IMG('1528735602780-2552fd46c7af'),
  'Veg Ragout & Herb Labneh': IMG('1512621776951-a57141f2eefd'),
  'Tropical Smoothie Bowl': IMG('1590301157890-4810ed352733'),
  'Cocoa Raspberry Smoothie Bowl': IMG('1610970881699-44a5587cabec'),
  'Granola Bowl': IMG('1517673401474-fa84f0f0d9d0'),
  'Honey Butter French Toast': IMG('1484723091739-30a097e8f929'),
  'Ricotta Pancakes': IMG('1567620905732-2d1ec7ab7445'),
};

const KEYWORD_POOL: Record<string, string[]> = {
  espresso: [IMG('1510591509098-f4fdc6d0ff04'), IMG('1509042239860-f550ce710b93')],
  cappuccino: [IMG('1572442388796-11668a67e53d'), IMG('1461023058943-07fcbe16d735')],
  latte: [IMG('1461023058943-07fcbe16d735'), IMG('1572442388796-11668a67e53d')],
  mocha: [IMG('1578314675240-a69180f0ce6a'), IMG('1461023058943-07fcbe16d735')],
  coffee: [IMG('1509042239860-f550ce710b93'), IMG('1510591509098-f4fdc6d0ff04'), IMG('1495474472287-4d71bcdd2085')],
  chai: [IMG('1571934811356-5cc061b6821f'), IMG('1564890369478-c89ca6d9cde9')],
  matcha: [IMG('1515823064-df3fc9fe7810'), IMG('1564890369478-c89ca6d9cde9')],
  tea: [IMG('1564890369478-c89ca6d9cde9'), IMG('1571934811356-5cc061b6821f')],
  juice: [IMG('1622597467836-f3281f7fd2f9'), IMG('1621506289937-a8e4df240d0e')],
  orange: [IMG('1621506289937-a8e4df240d0e'), IMG('1622597467836-f3281f7fd2f9')],
  smoothie: [IMG('1590301157890-4810ed352733'), IMG('1610970881699-44a5587cabec')],
  shake: [IMG('1572490122747-3969b75c99f1'), IMG('1606313564200-e75d5e30476e')],
  pancake: [IMG('1567620905732-2d1ec7ab7445'), IMG('1528203457805-9c0235af50fd')],
  waffle: [IMG('1562376552-0d160a2f238d'), IMG('1567620905732-2d1ec7ab7445')],
  egg: [IMG('1525351484163-7529414344d8'), IMG('1482049016688-2ed3cb1a218b'), IMG('1533089860892-a7c6f0a88666')],
  toast: [IMG('1484723091739-30a097e8f929'), IMG('1541519227359-08fa5d50c44d')],
  salad: [IMG('1512621776951-a57141f2eefd'), IMG('1546069901-ba9599a7e63c')],
  bowl: [IMG('1546069901-ba9599a7e63c'), IMG('1512621776951-a57141f2eefd')],
  quinoa: [IMG('1512621776951-a57141f2eefd'), IMG('1546069901-ba9599a7e63c')],
  sandwich: [IMG('1528735602780-2552fd46c7af'), IMG('1504674900247-0877df9cc836')],
  pasta: [IMG('1621996346565-e3dbc646d9a9'), IMG('1563379926898-05f4575a45d8'), IMG('1612874741227-5f572d59d5c4')],
  risotto: [IMG('1476124369801-bbc6d53f7d0e'), IMG('1621996346565-e3dbc646d9a9')],
  pizza: [IMG('1513104890138-7c749659a591'), IMG('1565299624946-b28f40a0ae38'), IMG('1574071318508-1cdbab80d002')],
  margherita: [IMG('1574071318508-1cdbab80d002'), IMG('1513104890138-7c749659a591')],
  biryani: [IMG('1563379091339-03246963d96a'), IMG('1585937421612-70a008356fbe')],
  butter: [IMG('1603894584373-5ac82b7447e0'), IMG('1585937421612-70a008356fbe')],
  curry: [IMG('1585937421612-70a008356fbe'), IMG('1603894584373-5ac82b7447e0')],
  paneer: [IMG('1631452180519-c014fe946bc7'), IMG('1603894584373-5ac82b7447e0')],
  dosa: [IMG('1668236541034-9512e4f4e6bf'), IMG('1585937421612-70a008356fbe')],
  ramen: [IMG('1569718212165-3a8278dfe5b3'), IMG('1591814468924-caf88d1232e1')],
  sushi: [IMG('1579584425555-c3ce17fd4351'), IMG('1559314809-0d155014e29e')],
  dumpling: [IMG('1496116218417-1a781b1df416'), IMG('1563245372-f21724e3856d')],
  burger: [IMG('1568901346375-23c9450c58cd'), IMG('1572802419224-296b0aeee0df')],
  wings: [IMG('1608039829572-7854f212c649'), IMG('1573080496219-b998a446ff69')],
  steak: [IMG('1544025162-d76694265947'), IMG('1546833999-b9f581a1996d')],
  cake: [IMG('1578985545062-69928b1d9587'), IMG('1488477181946-6428a0291777')],
  tiramisu: [IMG('1571877227200-a0d98ea607e9'), IMG('1578985545062-69928b1d9587')],
  brownie: [IMG('1607928558919-50d74ad2a0b4'), IMG('1578985545062-69928b1d9587')],
  mojito: [IMG('1551538827-9c037cb4f32a'), IMG('1544145945-f90425340c7e')],
  mocktail: [IMG('1544145945-f90425340c7e'), IMG('1551538827-9c037cb4f32a')],
  samosa: [IMG('1601050690597-df0568f70950'), IMG('1513456852971-3b5fcd5dd870')],
  nachos: [IMG('1513456852971-3b5fcd5dd870'), IMG('1573080496219-b998a446ff69')],
  soup: [IMG('1547592166-23ac45744acd'), IMG('1546069901-ba9599a7e63c')],
  nugget: [IMG('1562967914-608f82629710'), IMG('1573080496219-b998a446ff69')],
};

const CATEGORY_POOL: Record<string, string[]> = {
  'Savoury Breakfast': [IMG('1525351484163-7529414344d8'), IMG('1482049016688-2ed3cb1a218b'), IMG('1533089860892-a7c6f0a88666'), IMG('1484723091739-30a097e8f929'), IMG('1541519227359-08fa5d50c44d'), IMG('1528735602780-2552fd46c7af')],
  'Sweet Breakfast': [IMG('1567620905732-2d1ec7ab7445'), IMG('1590301157890-4810ed352733'), IMG('1517673401474-fa84f0f0d9d0'), IMG('1484723091739-30a097e8f929'), IMG('1610970881699-44a5587cabec')],
  'Coffee & Espresso': [IMG('1509042239860-f550ce710b93'), IMG('1510591509098-f4fdc6d0ff04'), IMG('1461023058943-07fcbe16d735'), IMG('1572442388796-11668a67e53d'), IMG('1495474472287-4d71bcdd2085')],
  'Artisan Teas': [IMG('1564890369478-c89ca6d9cde9'), IMG('1571934811356-5cc061b6821f'), IMG('1515823064-df3fc9fe7810'), IMG('1544145945-f90425340c7e')],
  'Fresh Juices': [IMG('1622597467836-f3281f7fd2f9'), IMG('1621506289937-a8e4df240d0e'), IMG('1600271886742-f049cd451bba'), IMG('1587049352846-4a222e784d38')],
  'Smoothies & Shakes': [IMG('1572490122747-3969b75c99f1'), IMG('1590301157890-4810ed352733'), IMG('1606313564200-e75d5e30476e'), IMG('1610970881699-44a5587cabec')],
  'Salads & Bowls': [IMG('1512621776951-a57141f2eefd'), IMG('1546069901-ba9599a7e63c'), IMG('1546793665-c74683f339c1'), IMG('1490645935967-10de6ba17061')],
  'Gourmet Sandwiches': [IMG('1528735602780-2552fd46c7af'), IMG('1504674900247-0877df9cc836'), IMG('1626700051175-6818013e1d4f'), IMG('1572695157366-5e585ab2b6f9')],
  'Pasta & Risotto': [IMG('1621996346565-e3dbc646d9a9'), IMG('1563379926898-05f4575a45d8'), IMG('1612874741227-5f572d59d5c4'), IMG('1574894709920-11b28e7367e3')],
  'Wood-Fired Pizza': [IMG('1513104890138-7c749659a591'), IMG('1565299624946-b28f40a0ae38'), IMG('1574071318508-1cdbab80d002'), IMG('1628840042765-356cda07504e')],
  'Indian Classics': [IMG('1585937421612-70a008356fbe'), IMG('1603894584373-5ac82b7447e0'), IMG('1563379091339-03246963d96a'), IMG('1631452180519-c014fe946bc7')],
  'Asian Street Food': [IMG('1569718212165-3a8278dfe5b3'), IMG('1559314809-0d155014e29e'), IMG('1579584425555-c3ce17fd4351'), IMG('1496116218417-1a781b1df416')],
  'Burgers & Grill': [IMG('1568901346375-23c9450c58cd'), IMG('1572802419224-296b0aeee0df'), IMG('1544025162-d76694265947'), IMG('1608039829572-7854f212c649')],
  'Desserts & Bakery': [IMG('1578985545062-69928b1d9587'), IMG('1571877227200-a0d98ea607e9'), IMG('1524351199678-941a58a3df50'), IMG('1607928558919-50d74ad2a0b4')],
  'Snacks & Tapas': [IMG('1513456852971-3b5fcd5dd870'), IMG('1572695157366-5e585ab2b6f9'), IMG('1626204475307-9d44c0e6159d'), IMG('1601050690597-df0568f70950')],
  'Kids Corner': [IMG('1565299624946-b28f40a0ae38'), IMG('1562967914-608f82629710'), IMG('1621996346565-e3dbc646d9a9'), IMG('1572490122747-3969b75c99f1')],
  'Seasonal Specials': [IMG('1547592166-23ac45744acd'), IMG('1546069901-ba9599a7e63c'), IMG('1544025162-d76694265947'), IMG('1512621776951-a57141f2eefd')],
  'Mocktails & Coolers': [IMG('1544145945-f90425340c7e'), IMG('1551538827-9c037cb4f32a'), IMG('1513558161293-cdaf765ed2fd'), IMG('1523677011783-8b2d5e1d9854')],
};

const GLOBAL_POOL = [
  IMG('1504674900247-0877df9cc836'), IMG('1546069901-ba9599a7e63c'), IMG('1565299624946-b28f40a0ae38'),
  IMG('1568901346375-23c9450c58cd'), IMG('1621996346565-e3dbc646d9a9'), IMG('1585937421612-70a008356fbe'),
  IMG('1509042239860-f550ce710b93'), IMG('1578985545062-69928b1d9587'), IMG('1525351484163-7529414344d8'),
];

const KEYWORD_ORDER = Object.keys(KEYWORD_POOL).sort((a, b) => b.length - a.length);

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickFromPool(pool: string[], name: string, salt = ''): string {
  const idx = (hashString(name + salt) + hashString([...name].reverse().join(''))) % pool.length;
  return pool[idx];
}

function matchKeyword(name: string): string | null {
  const lower = name.toLowerCase();
  for (const kw of KEYWORD_ORDER) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

function resolveLocal(name: string, category?: string | null, salt = ''): string {
  if (EXACT[name]) return EXACT[name];
  const kw = matchKeyword(name);
  if (kw) return pickFromPool(KEYWORD_POOL[kw], name, kw + salt);
  if (category && CATEGORY_POOL[category]) return pickFromPool(CATEGORY_POOL[category], name, category + salt);
  return pickFromPool(GLOBAL_POOL, name, 'global' + salt);
}

function isStaleUrl(url?: string | null): boolean {
  if (!url) return true;
  return url.includes('pollinations.ai') || url.startsWith('/foods/');
}

/** Prefer imageUrl from API (set by server seed); local resolver only as fallback. */
export function getFoodImage(name: string, imageUrl?: string | null, category?: string | null): string {
  if (imageUrl && imageUrl.startsWith('http') && !isStaleUrl(imageUrl)) return imageUrl;
  return resolveLocal(name, category);
}

export function getFoodImageFallback(name: string, category?: string | null): string {
  return resolveLocal(name, category, '-alt');
}
