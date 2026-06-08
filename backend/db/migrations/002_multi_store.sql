-- Multi-store support: add store column, rename trendyol_product_id -> external_product_id

ALTER TABLE products ADD COLUMN IF NOT EXISTS store VARCHAR(50) DEFAULT 'trendyol' NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'trendyol_product_id'
  ) THEN
    ALTER TABLE products RENAME COLUMN trendyol_product_id TO external_product_id;
  END IF;
END $$;

ALTER TABLE products ALTER COLUMN external_product_id TYPE VARCHAR(64) USING external_product_id::text;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_trendyol_product_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_external
  ON products (store, external_product_id);

CREATE INDEX IF NOT EXISTS idx_products_store ON products (store) WHERE is_active = true;

UPDATE products SET store = 'trendyol' WHERE store IS NULL OR store = '';
