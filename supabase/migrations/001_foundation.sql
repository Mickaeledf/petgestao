-- PetGestão: Migration 001 - Foundation
-- Establishes core tables: establishments, memberships, roles, permissions, and initial data types

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ESTABLISHMENTS
-- ============================================================
CREATE TABLE establishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  document VARCHAR(30),
  email VARCHAR(255),
  phone VARCHAR(30),
  address JSONB,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_establishments_status ON establishments(status);

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roles_establishment ON roles(establishment_id);

-- ============================================================
-- PERMISSIONS
-- ============================================================
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  module VARCHAR(50) NOT NULL
);

-- ============================================================
-- ROLE_PERMISSIONS
-- ============================================================
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- MEMBERSHIPS (user <-> establishment)
-- ============================================================
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, user_id)
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_establishment ON memberships(establishment_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, name)
);

CREATE INDEX idx_categories_establishment ON categories(establishment_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  internal_code VARCHAR(50),
  barcode VARCHAR(50),
  brand VARCHAR(100),
  unit VARCHAR(20) NOT NULL DEFAULT 'unidade',
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL,
  minimum_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  maximum_stock NUMERIC(12,3),
  track_lots BOOLEAN NOT NULL DEFAULT false,
  track_expiry BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_sale_price_positive CHECK (sale_price >= 0),
  CONSTRAINT chk_cost_price_positive CHECK (cost_price >= 0)
);

CREATE INDEX idx_products_establishment ON products(establishment_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_barcode ON products(establishment_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_internal_code ON products(establishment_id, internal_code) WHERE internal_code IS NOT NULL;
CREATE UNIQUE INDEX idx_products_unique_internal_code ON products(establishment_id, internal_code) WHERE internal_code IS NOT NULL AND internal_code != '';
CREATE UNIQUE INDEX idx_products_unique_barcode ON products(establishment_id, barcode) WHERE barcode IS NOT NULL AND barcode != '';

-- ============================================================
-- CUSTOMERS (Tutores)
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(255),
  document VARCHAR(30),
  address JSONB,
  contact_preferences JSONB,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_establishment ON customers(establishment_id);
CREATE INDEX idx_customers_phone ON customers(establishment_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_name ON customers(establishment_id, name);

-- ============================================================
-- PETS (Animais)
-- ============================================================
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  species VARCHAR(50) NOT NULL DEFAULT 'Cão',
  breed VARCHAR(100),
  sex VARCHAR(20),
  birth_date DATE,
  size VARCHAR(20)
    CHECK (size IS NULL OR size IN ('mini', 'pequeno', 'medio', 'grande', 'gigante')),
  color VARCHAR(100),
  weight NUMERIC(6,2),
  weight_date DATE,
  photo_path TEXT,
  behavior_notes TEXT,
  care_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pets_establishment ON pets(establishment_id);
CREATE INDEX idx_pets_customer ON pets(customer_id);

-- ============================================================
-- SUPPLIERS (Fornecedores)
-- ============================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  document VARCHAR(30),
  phone VARCHAR(30),
  email VARCHAR(255),
  address TEXT,
  contact_name VARCHAR(255),
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_establishment ON suppliers(establishment_id);

-- ============================================================
-- SERVICES (Serviços)
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_base_price_positive CHECK (base_price >= 0),
  CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0)
);

CREATE INDEX idx_services_establishment ON services(establishment_id);

-- ============================================================
-- PROFESSIONALS (Profissionais)
-- ============================================================
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_professionals_establishment ON professionals(establishment_id);

-- ============================================================
-- PROFESSIONAL_SERVICES
-- ============================================================
CREATE TABLE professional_services (
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (professional_id, service_id)
);

-- ============================================================
-- STOCK BALANCES
-- ============================================================
CREATE TABLE stock_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (establishment_id, product_id)
);

CREATE INDEX idx_stock_balances_product ON stock_balances(product_id);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type VARCHAR(30) NOT NULL
    CHECK (movement_type IN (
      'initial', 'purchase', 'sale', 'return_customer', 'return_supplier',
      'adjustment_positive', 'adjustment_negative', 'loss', 'expiry',
      'internal_use', 'correction'
    )),
  quantity NUMERIC(12,3) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_establishment ON stock_movements(establishment_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);

-- ============================================================
-- LICENSES
-- ============================================================
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'basic',
  license_key_hash TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'expired', 'revoked')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_licenses_establishment ON licenses(establishment_id);

-- ============================================================
-- LICENSE EVENTS
-- ============================================================
CREATE TABLE license_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  actor_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  actor_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_establishment ON audit_logs(establishment_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper function: get user's establishment IDs
CREATE OR REPLACE FUNCTION get_user_establishment_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT establishment_id
  FROM memberships
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

-- Enable RLS on all tenant tables
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Establishments: users can see only their own
CREATE POLICY establishments_select ON establishments
  FOR SELECT USING (id IN (SELECT get_user_establishment_ids()));

CREATE POLICY establishments_update ON establishments
  FOR UPDATE USING (id IN (SELECT get_user_establishment_ids()));

-- Memberships: users can see their own memberships
CREATE POLICY memberships_select ON memberships
  FOR SELECT USING (user_id = auth.uid() OR establishment_id IN (SELECT get_user_establishment_ids()));

-- Roles: visible within establishment
CREATE POLICY roles_select ON roles
  FOR SELECT USING (
    establishment_id IS NULL
    OR establishment_id IN (SELECT get_user_establishment_ids())
  );

-- Categories
CREATE POLICY categories_select ON categories
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY categories_insert ON categories
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY categories_update ON categories
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY categories_delete ON categories
  FOR DELETE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Products
CREATE POLICY products_select ON products
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY products_insert ON products
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY products_update ON products
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Customers
CREATE POLICY customers_select ON customers
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY customers_insert ON customers
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY customers_update ON customers
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Pets
CREATE POLICY pets_select ON pets
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY pets_insert ON pets
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY pets_update ON pets
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Suppliers
CREATE POLICY suppliers_select ON suppliers
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY suppliers_insert ON suppliers
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY suppliers_update ON suppliers
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Services
CREATE POLICY services_select ON services
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY services_insert ON services
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY services_update ON services
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Professionals
CREATE POLICY professionals_select ON professionals
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY professionals_insert ON professionals
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY professionals_update ON professionals
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Professional Services (join table)
CREATE POLICY professional_services_select ON professional_services
  FOR SELECT USING (
    professional_id IN (
      SELECT id FROM professionals WHERE establishment_id IN (SELECT get_user_establishment_ids())
    )
  );
CREATE POLICY professional_services_insert ON professional_services
  FOR INSERT WITH CHECK (
    professional_id IN (
      SELECT id FROM professionals WHERE establishment_id IN (SELECT get_user_establishment_ids())
    )
  );

-- Stock Balances
CREATE POLICY stock_balances_select ON stock_balances
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY stock_balances_insert ON stock_balances
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY stock_balances_update ON stock_balances
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Stock Movements
CREATE POLICY stock_movements_select ON stock_movements
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY stock_movements_insert ON stock_movements
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));

-- Licenses
CREATE POLICY licenses_select ON licenses
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Audit Logs
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT USING (
    establishment_id IS NULL
    OR establishment_id IN (SELECT get_user_establishment_ids())
  );
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT WITH CHECK (
    establishment_id IS NULL
    OR establishment_id IN (SELECT get_user_establishment_ids())
  );

-- ============================================================
-- SEED: System roles and permissions
-- ============================================================
INSERT INTO permissions (key, description, module) VALUES
  ('dashboard.view', 'Ver dashboard', 'dashboard'),
  ('products.view', 'Ver produtos', 'products'),
  ('products.create', 'Criar produtos', 'products'),
  ('products.edit', 'Editar produtos', 'products'),
  ('products.delete', 'Excluir produtos', 'products'),
  ('stock.view', 'Ver estoque', 'stock'),
  ('stock.adjust', 'Ajustar estoque', 'stock'),
  ('customers.view', 'Ver tutores', 'customers'),
  ('customers.create', 'Criar tutores', 'customers'),
  ('customers.edit', 'Editar tutores', 'customers'),
  ('pets.view', 'Ver animais', 'pets'),
  ('pets.create', 'Criar animais', 'pets'),
  ('pets.edit', 'Editar animais', 'pets'),
  ('services.view', 'Ver serviços', 'services'),
  ('services.create', 'Criar serviços', 'services'),
  ('services.edit', 'Editar serviços', 'services'),
  ('professionals.view', 'Ver profissionais', 'professionals'),
  ('professionals.create', 'Criar profissionais', 'professionals'),
  ('professionals.edit', 'Editar profissionais', 'professionals'),
  ('schedule.view', 'Ver agenda', 'schedule'),
  ('schedule.create', 'Criar agendamentos', 'schedule'),
  ('schedule.edit', 'Editar agendamentos', 'schedule'),
  ('schedule.cancel', 'Cancelar agendamentos', 'schedule'),
  ('sales.view', 'Ver vendas', 'sales'),
  ('sales.create', 'Criar vendas', 'sales'),
  ('sales.cancel', 'Cancelar vendas', 'sales'),
  ('sales.discount', 'Aplicar descontos', 'sales'),
  ('cash.view', 'Ver caixa', 'cash'),
  ('cash.open', 'Abrir caixa', 'cash'),
  ('cash.close', 'Fechar caixa', 'cash'),
  ('cash.withdraw', 'Retiradas de caixa', 'cash'),
  ('financial.view', 'Ver financeiro', 'financial'),
  ('financial.create', 'Criar lançamentos', 'financial'),
  ('financial.edit', 'Editar lançamentos', 'financial'),
  ('reports.view', 'Ver relatórios', 'reports'),
  ('reports.financial', 'Relatórios financeiros', 'reports'),
  ('reports.export', 'Exportar relatórios', 'reports'),
  ('suppliers.view', 'Ver fornecedores', 'suppliers'),
  ('suppliers.create', 'Criar fornecedores', 'suppliers'),
  ('suppliers.edit', 'Editar fornecedores', 'suppliers'),
  ('purchases.view', 'Ver compras', 'purchases'),
  ('purchases.create', 'Criar compras', 'purchases'),
  ('users.view', 'Ver usuários', 'users'),
  ('users.manage', 'Gerenciar usuários', 'users'),
  ('settings.view', 'Ver configurações', 'settings'),
  ('settings.edit', 'Editar configurações', 'settings'),
  ('license.view', 'Ver licença', 'license');

-- System roles (not tied to any establishment)
INSERT INTO roles (name, description, is_system) VALUES
  ('proprietario', 'Proprietário - Acesso total ao estabelecimento', true),
  ('gerente', 'Gerente - Gestão operacional', true),
  ('atendente', 'Atendente/Caixa - Vendas e atendimento', true),
  ('banhista', 'Banhista/Tosador - Serviços de banho e tosa', true),
  ('estoquista', 'Estoquista - Controle de estoque', true),
  ('financeiro', 'Financeiro - Gestão financeira', true);

-- Grant all permissions to proprietario
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'proprietario' AND r.is_system = true;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_establishments_updated_at BEFORE UPDATE ON establishments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pets_updated_at BEFORE UPDATE ON pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_professionals_updated_at BEFORE UPDATE ON professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
