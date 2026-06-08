-- Local dev init (without TimescaleDB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  apple_id VARCHAR(255) UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  push_token TEXT,
  notification_settings JSONB DEFAULT '{"deals": true, "favorites": true}'::jsonb,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  product_count INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

INSERT INTO categories (slug, name, icon, sort_order) VALUES
  ('all', 'Tümü', 'pricetag', 0),
  ('moda', 'Moda', 'shirt', 1),
  ('elektronik', 'Elektronik', 'laptop', 2),
  ('ev-yasam', 'Ev & Yaşam', 'home', 3),
  ('kozmetik', 'Kozmetik', 'sparkles', 4),
  ('oyun', 'Oyun & Eğlence', 'game-controller', 5)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store VARCHAR(50) DEFAULT 'trendyol' NOT NULL,
  external_product_id VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  brand VARCHAR(255),
  category_id INT REFERENCES categories(id),
  image_url TEXT,
  product_url TEXT NOT NULL,
  current_price DECIMAL(12, 2),
  original_price DECIMAL(12, 2),
  monitoring_tier VARCHAR(10) DEFAULT 'P1',
  source VARCHAR(50) DEFAULT 'flash_deals',
  is_active BOOLEAN DEFAULT true,
  is_flash BOOLEAN DEFAULT true,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_external ON products(store, external_product_id);
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_next_check ON products(next_check_at) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS price_history (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_pct INT NOT NULL,
  is_6m_low BOOLEAN DEFAULT false,
  avg_180d DECIMAL(12, 2),
  min_180d DECIMAL(12, 2),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  title VARCHAR(255),
  subtitle TEXT,
  link_url TEXT NOT NULL,
  active_from TIMESTAMPTZ DEFAULT NOW(),
  active_to TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO banners (image_url, title, subtitle, link_url, sort_order)
SELECT 'https://picsum.photos/800/400?random=1', 'GÜNÜN FIRSATI', 'Seçili Ürünlerde %70''e Varan İndirim!', 'https://www.trendyol.com', 0
WHERE NOT EXISTS (SELECT 1 FROM banners LIMIT 1);

CREATE TABLE IF NOT EXISTS push_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_at_push DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo products for UI testing
INSERT INTO products (store, external_product_id, title, brand, category_id, image_url, product_url, current_price, original_price, is_flash)
SELECT 'trendyol', '100001', 'Nike Air Max 90 Erkek Spor Ayakkabı', 'Nike', 2,
  'https://picsum.photos/200/200?random=10', 'https://www.trendyol.com', 1499, 2499, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE store = 'trendyol' AND external_product_id = '100001');

INSERT INTO products (store, external_product_id, title, brand, category_id, image_url, product_url, current_price, original_price, is_flash)
SELECT 'trendyol', '100002', 'Apple AirPods Pro 2. Nesil', 'Apple', 3,
  'https://picsum.photos/200/200?random=11', 'https://www.trendyol.com', 6499, 8999, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE store = 'trendyol' AND external_product_id = '100002');

INSERT INTO products (store, external_product_id, title, brand, category_id, image_url, product_url, current_price, original_price, is_flash)
SELECT 'trendyol', '100003', 'Derimod Kadın Deri Çanta', 'Derimod', 2,
  'https://picsum.photos/200/200?random=12', 'https://www.trendyol.com', 899, 1499, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE store = 'trendyol' AND external_product_id = '100003');
