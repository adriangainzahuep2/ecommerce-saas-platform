CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id BIGINT REFERENCES categories(id),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES categories(id),
  base_price DOUBLE PRECISION NOT NULL,
  final_price DOUBLE PRECISION NOT NULL,
  platform_fee DOUBLE PRECISION DEFAULT 0.03,
  sku VARCHAR(100) UNIQUE,
  weight DOUBLE PRECISION,
  dimensions JSONB,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_combo BOOLEAN DEFAULT FALSE,
  expiration_date DATE,
  images JSONB,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE combo_products (
  id BIGSERIAL PRIMARY KEY,
  combo_id BIGINT REFERENCES products(id),
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  whatsapp_number VARCHAR(20) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  preferences JSONB,
  total_orders INTEGER DEFAULT 0,
  total_spent DOUBLE PRECISION DEFAULT 0,
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DOUBLE PRECISION NOT NULL,
  platform_fee DOUBLE PRECISION NOT NULL,
  total DOUBLE PRECISION NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  delivery_address TEXT,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  total_price DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE whatsapp_messages (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  message_id VARCHAR(255) UNIQUE,
  message_type VARCHAR(50),
  content TEXT,
  audio_url TEXT,
  transcription TEXT,
  is_purchase_intent BOOLEAN DEFAULT FALSE,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_requests (
  id BIGSERIAL PRIMARY KEY,
  request_id VARCHAR(100) UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES customers(id),
  message_id BIGINT REFERENCES whatsapp_messages(id),
  products_requested JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_data JSONB,
  image_url TEXT,
  ocr_extracted_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id),
  movement_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id BIGINT,
  reference_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer_interactions (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  product_id BIGINT REFERENCES products(id),
  interaction_type VARCHAR(50),
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recommendations (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT REFERENCES customers(id),
  product_id BIGINT REFERENCES products(id),
  score DOUBLE PRECISION,
  algorithm VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_units (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id),
  amount DOUBLE PRECISION NOT NULL,
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_customer_interactions_customer ON customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_product ON customer_interactions(product_id);
CREATE INDEX idx_whatsapp_messages_customer ON whatsapp_messages(customer_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
