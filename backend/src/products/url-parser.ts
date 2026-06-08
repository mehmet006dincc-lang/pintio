export type StoreSlug =
  | 'trendyol'
  | 'hepsiburada'
  | 'n11'
  | 'mediamarkt'
  | 'amazon'
  | 'migros';

export interface ParsedProductUrl {
  store: StoreSlug;
  externalProductId: string;
  productUrl: string;
}

const STORE_PATTERNS: { store: StoreSlug; test: RegExp; extract: RegExp }[] = [
  {
    store: 'trendyol',
    test: /trendyol\.com/i,
    extract: /-p-(\d+)/,
  },
  {
    store: 'hepsiburada',
    test: /hepsiburada\.com/i,
    extract: /-p-(HBCV[A-Z0-9]+)/i,
  },
  {
    store: 'n11',
    test: /n11\.com/i,
    extract: /-(\d{6,})(?:\?|$|\/)/,
  },
  {
    store: 'mediamarkt',
    test: /mediamarkt\.com\.tr/i,
    extract: /-(\d+)\.html/i,
  },
  {
    store: 'amazon',
    test: /amazon\.com\.tr/i,
    extract: /(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i,
  },
  {
    store: 'migros',
    test: /migros\.com\.tr/i,
    extract: /-p-([a-f0-9]+)/i,
  },
];

export function parseProductUrl(rawUrl: string): ParsedProductUrl | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let productUrl = trimmed.split('?')[0];
  if (!productUrl.startsWith('http')) {
    productUrl = `https://${productUrl}`;
  }

  for (const { store, test, extract } of STORE_PATTERNS) {
    if (!test.test(productUrl)) continue;
    const match = productUrl.match(extract);
    if (!match) continue;
    return {
      store,
      externalProductId: match[1],
      productUrl,
    };
  }

  return null;
}

export const STORE_LABELS: Record<StoreSlug, string> = {
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  n11: 'N11',
  mediamarkt: 'MediaMarkt',
  amazon: 'Amazon',
  migros: 'Migros',
};
