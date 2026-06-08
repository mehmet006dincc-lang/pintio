/** Multi-store URL validation and labels */

export type StoreSlug =
  | 'trendyol'
  | 'hepsiburada'
  | 'n11'
  | 'mediamarkt'
  | 'amazon'
  | 'migros';

export const STORE_LABELS: Record<StoreSlug, string> = {
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  n11: 'N11',
  mediamarkt: 'MediaMarkt',
  amazon: 'Amazon',
  migros: 'Migros',
};

const URL_PATTERNS: { store: StoreSlug; test: RegExp; extract: RegExp }[] = [
  { store: 'trendyol', test: /trendyol\.com/i, extract: /-p-(\d+)/ },
  { store: 'hepsiburada', test: /hepsiburada\.com/i, extract: /-p-(HBCV[A-Z0-9]+)/i },
  { store: 'n11', test: /n11\.com/i, extract: /-(\d{6,})(?:\?|$|\/)/ },
  { store: 'mediamarkt', test: /mediamarkt\.com\.tr/i, extract: /-(\d+)\.html/i },
  { store: 'amazon', test: /amazon\.com\.tr/i, extract: /(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i },
  { store: 'migros', test: /migros\.com\.tr/i, extract: /-p-([a-f0-9]+)/i },
];

export function parseProductUrl(url: string): { store: StoreSlug; externalId: string } | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let normalized = trimmed.split('?')[0];
  if (!normalized.startsWith('http')) normalized = `https://${normalized}`;

  for (const { store, test, extract } of URL_PATTERNS) {
    if (!test.test(normalized)) continue;
    const match = normalized.match(extract);
    if (match) return { store, externalId: match[1] };
  }
  return null;
}

export function isValidProductUrl(url: string): boolean {
  return parseProductUrl(url) !== null;
}

export const SUPPORTED_STORES_TEXT =
  'Trendyol, Hepsiburada, N11, MediaMarkt, Amazon TR veya Migros';

export const URL_EXAMPLES: Record<StoreSlug, string> = {
  trendyol: 'https://www.trendyol.com/marka/urun-adi-p-123456789',
  hepsiburada: 'https://www.hepsiburada.com/urun-adi-p-HBCV00004X9ZCK',
  n11: 'https://www.n11.com/urun/urun-adi-106765738',
  mediamarkt: 'https://www.mediamarkt.com.tr/tr/product/_urun-1232440.html',
  amazon: 'https://www.amazon.com.tr/dp/B0CHXCFS1J',
  migros: 'https://www.migros.com.tr/urun-adi-p-7aae79',
};
