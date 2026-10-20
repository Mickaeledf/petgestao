-- PetGestão: Migration 003 - Onboarding function + Purchases table
-- Allows new users to create their first establishment

-- Helper: set_updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- ONBOARDING: create establishment + owner membership atomically
-- ============================================================
CREATE OR REPLACE FUNCTION create_establishment_with_owner(
  p_name TEXT,
  p_document TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_establishment_id UUID;
  v_owner_role_id UUID;
BEGIN
  SELECT id INTO v_owner_role_id
    FROM roles WHERE name = 'proprietario' AND establishment_id IS NULL AND is_system = true
    LIMIT 1;

  IF v_owner_role_id IS NULL THEN
    RAISE EXCEPTION 'Owner role not found';
  END IF;

  INSERT INTO establishments (name, document, email, phone)
    VALUES (p_name, p_document, p_email, p_phone)
    RETURNING id INTO v_establishment_id;

  INSERT INTO memberships (establishment_id, user_id, role_id, status)
    VALUES (v_establishment_id, auth.uid(), v_owner_role_id, 'active');

  RETURN v_establishment_id;
END;
$$;

-- ============================================================
-- PURCHASES
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_number SERIAL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'received', 'partial', 'cancelled')),
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  expected_date DATE,
  received_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchases_establishment ON purchases(establishment_id);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_quantity NUMERIC(12,3) DEFAULT 0
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);

-- RLS for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchases_select ON purchases
  FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY purchases_insert ON purchases
  FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY purchases_update ON purchases
  FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

CREATE POLICY purchase_items_select ON purchase_items
  FOR SELECT USING (purchase_id IN (SELECT id FROM purchases WHERE establishment_id IN (SELECT get_user_establishment_ids())));
CREATE POLICY purchase_items_insert ON purchase_items
  FOR INSERT WITH CHECK (purchase_id IN (SELECT id FROM purchases WHERE establishment_id IN (SELECT get_user_establishment_ids())));
CREATE POLICY purchase_items_update ON purchase_items
  FOR UPDATE USING (purchase_id IN (SELECT id FROM purchases WHERE establishment_id IN (SELECT get_user_establishment_ids())));
CREATE POLICY purchase_items_delete ON purchase_items
  FOR DELETE USING (purchase_id IN (SELECT id FROM purchases WHERE establishment_id IN (SELECT get_user_establishment_ids())));

-- Triggers
CREATE TRIGGER set_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
