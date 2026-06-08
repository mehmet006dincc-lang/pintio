-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users
CREATE TABLE users (
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

-- Categories
CREATE TABLE categories (
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
  ('oyun', 'Oyun & Eğlence', 'game-controller', 5);

-- Products
CREATE TABLE products (
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

CREATE UNIQUE INDEX idx_products_store_external ON products(store, external_product_id);
CREATE INDEX idx_products_store ON products(store) WHERE is_active = true;
CREATE INDEX idx_products_next_check ON products(next_check_at) WHERE is_active = true;
CREATE INDEX idx_products_tier ON products(monitoring_tier) WHERE is_active = true;
CREATE INDEX idx_products_category ON products(category_id) WHERE is_active = true;

-- Price history (TimescaleDB hypertable)
CREATE TABLE price_history (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  in_stock BOOLEAN DEFAULT true,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT create_hypertable('price_history', 'recorded_at', if_not_exists => TRUE);
CREATE INDEX idx_price_history_product ON price_history(product_id, recorded_at DESC);

-- Deals feed cache
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_pct INT NOT NULL,
  is_6m_low BOOLEAN DEFAULT false,
  avg_180d DECIMAL(12, 2),
  min_180d DECIMAL(12, 2),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

CREATE INDEX idx_deals_detected ON deals(detected_at DESC);

-- Favorites
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);

-- Sponsor banners
CREATE TABLE banners (
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

-- Seed demo banner
INSERT INTO banners (image_url, title, subtitle, link_url, sort_order) VALUES
  ('https://picsum.photos/800/400?random=1', 'GÜNÜN FIRSATI', 'Seçili Ürünlerde %70''e Varan İndirim!', 'https://www.trendyol.com', 0);

-- Push notification tracking (avoid duplicate pushes)
CREATE TABLE push_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_at_push DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_log_user_product ON push_log(user_id, product_id, created_at DESC);
