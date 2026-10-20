-- PetGestão: Migration 002 - Sales, Cash Register, Schedule, Service Orders

-- ============================================================
-- SALES (Vendas)
-- ============================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sale_number SERIAL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'completed', 'cancelled')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  sold_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_establishment ON sales(establishment_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_status ON sales(establishment_id, status);
CREATE INDEX idx_sales_created ON sales(created_at);

-- ============================================================
-- SALE ITEMS
-- ============================================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  item_type VARCHAR(20) NOT NULL DEFAULT 'product'
    CHECK (item_type IN ('product', 'service')),
  description VARCHAR(255) NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- ============================================================
-- SALE PAYMENTS
-- ============================================================
CREATE TABLE sale_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  method VARCHAR(30) NOT NULL
    CHECK (method IN ('dinheiro', 'pix', 'credito', 'debito', 'outro')),
  amount NUMERIC(12,2) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);

-- ============================================================
-- CASH REGISTER (Caixa)
-- ============================================================
CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed')),
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(12,2),
  expected_balance NUMERIC(12,2),
  difference NUMERIC(12,2),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_cash_registers_establishment ON cash_registers(establishment_id);
CREATE INDEX idx_cash_registers_status ON cash_registers(establishment_id, status);

-- ============================================================
-- CASH MOVEMENTS (Movimentações de caixa)
-- ============================================================
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  movement_type VARCHAR(30) NOT NULL
    CHECK (movement_type IN ('sale', 'withdrawal', 'deposit', 'expense', 'opening')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  sale_id UUID REFERENCES sales(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_movements_register ON cash_movements(cash_register_id);

-- ============================================================
-- FINANCIAL TRANSACTIONS (Lançamentos financeiros)
-- ============================================================
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  paid_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method VARCHAR(30),
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_establishment ON financial_transactions(establishment_id);
CREATE INDEX idx_financial_status ON financial_transactions(establishment_id, status);
CREATE INDEX idx_financial_due_date ON financial_transactions(due_date);

-- ============================================================
-- APPOINTMENTS (Agendamentos)
-- ============================================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  price NUMERIC(12,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_establishment ON appointments(establishment_id);
CREATE INDEX idx_appointments_date ON appointments(establishment_id, date);
CREATE INDEX idx_appointments_professional ON appointments(professional_id, date);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);

-- ============================================================
-- SERVICE ORDERS (Ordens de Serviço)
-- ============================================================
CREATE TABLE service_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  order_number SERIAL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered', 'cancelled')),
  checkin_notes TEXT,
  checkout_notes TEXT,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_orders_establishment ON service_orders(establishment_id);
CREATE INDEX idx_service_orders_status ON service_orders(establishment_id, status);
CREATE INDEX idx_service_orders_customer ON service_orders(customer_id);

-- ============================================================
-- SERVICE ORDER ITEMS
-- ============================================================
CREATE TABLE service_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  item_type VARCHAR(20) NOT NULL DEFAULT 'service'
    CHECK (item_type IN ('service', 'product')),
  description VARCHAR(255) NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_so_items_order ON service_order_items(service_order_id);

-- ============================================================
-- RLS for new tables
-- ============================================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order_items ENABLE ROW LEVEL SECURITY;

-- Sales policies
CREATE POLICY sales_select ON sales FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY sales_insert ON sales FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY sales_update ON sales FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

CREATE POLICY sale_items_select ON sale_items FOR SELECT USING (sale_id IN (SELECT id FROM sales WHERE establishment_id IN (SELECT get_user_establishment_ids())));
CREATE POLICY sale_items_insert ON sale_items FOR INSERT WITH CHECK (sale_id IN (SELECT id FROM sales WHERE establishment_id IN (SELECT get_user_establishment_ids())));

CREATE POLICY sale_payments_select ON sale_payments FOR SELECT USING (sale_id IN (SELECT id FROM sales WHERE establishment_id IN (SELECT get_user_establishment_ids())));
CREATE POLICY sale_payments_insert ON sale_payments FOR INSERT WITH CHECK (sale_id IN (SELECT id FROM sales WHERE establishment_id IN (SELECT get_user_establishment_ids())));

-- Cash register policies
CREATE POLICY cash_registers_select ON cash_registers FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY cash_registers_insert ON cash_registers FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY cash_registers_update ON cash_registers FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

CREATE POLICY cash_movements_select ON cash_movements FOR SELECT USING (cash_register_id IN (SELECT id FROM cash_registers WHERE establishment_id IN (SELECT get_user_establishment_ids())));
CREATE POLICY cash_movements_insert ON cash_movements FOR INSERT WITH CHECK (cash_register_id IN (SELECT id FROM cash_registers WHERE establishment_id IN (SELECT get_user_establishment_ids())));

-- Financial policies
CREATE POLICY financial_select ON financial_transactions FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY financial_insert ON financial_transactions FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY financial_update ON financial_transactions FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Appointments policies
CREATE POLICY appointments_select ON appointments FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY appointments_insert ON appointments FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY appointments_update ON appointments FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

-- Service orders policies
CREATE POLICY service_orders_select ON service_orders FOR SELECT USING (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY service_orders_insert ON service_orders FOR INSERT WITH CHECK (establishment_id IN (SELECT get_user_establishment_ids()));
CREATE POLICY service_orders_update ON service_orders FOR UPDATE USING (establishment_id IN (SELECT get_user_establishment_ids()));

CREATE POLICY so_items_select ON service_order_items FOR SELECT USING (service_order_id IN (SELECT id FROM service_orders WHERE establishment_id IN (SELECT get_user_establishment_ids())));
CREATE POLICY so_items_insert ON service_order_items FOR INSERT WITH CHECK (service_order_id IN (SELECT id FROM service_orders WHERE establishment_id IN (SELECT get_user_establishment_ids())));

-- Updated_at triggers for new tables
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_financial_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_service_orders_updated_at BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
