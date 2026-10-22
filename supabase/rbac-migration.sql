-- ============================================================
-- PetGestão RBAC - Role-Based Access Control
-- Migration: Permissões por módulo com CRUD granular
-- ============================================================

-- 1. Tabela de permissões por cargo (role_permissions)
-- Cada registro = 1 cargo + 1 módulo + ações permitidas (CRUD)
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_id, module)
);

-- 2. Tabela de permissões customizadas por membro (member_permission_overrides)
-- Permite ao proprietário dar/tirar permissões pontuais a um membro específico
CREATE TABLE IF NOT EXISTS member_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_view boolean,
  can_create boolean,
  can_edit boolean,
  can_delete boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(membership_id, module)
);

-- 3. Adicionar coluna is_owner na tabela roles (para bypass total)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'is_owner'
  ) THEN
    ALTER TABLE roles ADD COLUMN is_owner boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- 4. Lista de todos os módulos do sistema
-- dashboard, sales, pdv, cash_register,
-- customers, pets, products, services, professionals, suppliers,
-- schedule, service_orders, stock, purchases,
-- financial, reports, users, settings, license

-- ============================================================
-- 5. Inserir cargos padrão do sistema (idempotente)
-- ============================================================

-- Função para criar roles e permissions padrão para um estabelecimento
CREATE OR REPLACE FUNCTION create_default_roles_for_establishment(est_id uuid)
RETURNS void AS $$
DECLARE
  r_proprietario uuid;
  r_gerente uuid;
  r_atendente uuid;
  r_banhista uuid;
  r_estoquista uuid;
  r_financeiro uuid;
BEGIN
  -- Proprietário
  INSERT INTO roles (establishment_id, name, description, is_system, is_owner)
  VALUES (est_id, 'proprietario', 'Acesso total e irrestrito ao sistema', true, true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_proprietario;
  IF r_proprietario IS NULL THEN
    SELECT id INTO r_proprietario FROM roles WHERE establishment_id = est_id AND name = 'proprietario';
  END IF;

  -- Gerente
  INSERT INTO roles (establishment_id, name, description, is_system, is_owner)
  VALUES (est_id, 'gerente', 'Gestão operacional completa', true, false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_gerente;
  IF r_gerente IS NULL THEN
    SELECT id INTO r_gerente FROM roles WHERE establishment_id = est_id AND name = 'gerente';
  END IF;

  -- Atendente
  INSERT INTO roles (establishment_id, name, description, is_system, is_owner)
  VALUES (est_id, 'atendente', 'Atendimento e vendas', true, false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_atendente;
  IF r_atendente IS NULL THEN
    SELECT id INTO r_atendente FROM roles WHERE establishment_id = est_id AND name = 'atendente';
  END IF;

  -- Banhista
  INSERT INTO roles (establishment_id, name, description, is_system, is_owner)
  VALUES (est_id, 'banhista', 'Foco em serviços e agenda', true, false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_banhista;
  IF r_banhista IS NULL THEN
    SELECT id INTO r_banhista FROM roles WHERE establishment_id = est_id AND name = 'banhista';
  END IF;

  -- Estoquista
  INSERT INTO roles (establishment_id, name, description, is_system, is_owner)
  VALUES (est_id, 'estoquista', 'Foco em suprimentos', true, false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_estoquista;
  IF r_estoquista IS NULL THEN
    SELECT id INTO r_estoquista FROM roles WHERE establishment_id = est_id AND name = 'estoquista';
  END IF;

  -- Financeiro
  INSERT INTO roles (establishment_id, name, description, is_system, is_owner)
  VALUES (est_id, 'financeiro', 'Foco fiscal e financeiro', true, false)
  ON CONFLICT DO NOTHING
  RETURNING id INTO r_financeiro;
  IF r_financeiro IS NULL THEN
    SELECT id INTO r_financeiro FROM roles WHERE establishment_id = est_id AND name = 'financeiro';
  END IF;

  -- ============================================================
  -- PERMISSÕES POR CARGO
  -- ============================================================

  -- PROPRIETÁRIO: não precisa de registros (is_owner = true faz bypass)
  -- Mas incluímos para exibição na UI
  INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES
    (r_proprietario, 'dashboard', true, true, true, true),
    (r_proprietario, 'sales', true, true, true, true),
    (r_proprietario, 'pdv', true, true, true, true),
    (r_proprietario, 'cash_register', true, true, true, true),
    (r_proprietario, 'customers', true, true, true, true),
    (r_proprietario, 'pets', true, true, true, true),
    (r_proprietario, 'products', true, true, true, true),
    (r_proprietario, 'services', true, true, true, true),
    (r_proprietario, 'professionals', true, true, true, true),
    (r_proprietario, 'suppliers', true, true, true, true),
    (r_proprietario, 'schedule', true, true, true, true),
    (r_proprietario, 'service_orders', true, true, true, true),
    (r_proprietario, 'stock', true, true, true, true),
    (r_proprietario, 'purchases', true, true, true, true),
    (r_proprietario, 'financial', true, true, true, true),
    (r_proprietario, 'reports', true, true, true, true),
    (r_proprietario, 'users', true, true, true, true),
    (r_proprietario, 'settings', true, true, true, true),
    (r_proprietario, 'license', true, true, true, true)
  ON CONFLICT (role_id, module) DO NOTHING;

  -- GERENTE: tudo exceto configurações e licença
  INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES
    (r_gerente, 'dashboard', true, true, true, true),
    (r_gerente, 'sales', true, true, true, true),
    (r_gerente, 'pdv', true, true, true, true),
    (r_gerente, 'cash_register', true, true, true, true),
    (r_gerente, 'customers', true, true, true, true),
    (r_gerente, 'pets', true, true, true, true),
    (r_gerente, 'products', true, true, true, true),
    (r_gerente, 'services', true, true, true, true),
    (r_gerente, 'professionals', true, true, true, true),
    (r_gerente, 'suppliers', true, true, true, true),
    (r_gerente, 'schedule', true, true, true, true),
    (r_gerente, 'service_orders', true, true, true, true),
    (r_gerente, 'stock', true, true, true, true),
    (r_gerente, 'purchases', true, true, true, true),
    (r_gerente, 'financial', true, true, true, true),
    (r_gerente, 'reports', true, true, true, true),
    (r_gerente, 'users', true, true, true, true),
    (r_gerente, 'settings', false, false, false, false),
    (r_gerente, 'license', false, false, false, false)
  ON CONFLICT (role_id, module) DO NOTHING;

  -- ATENDENTE: Dashboard, Vendas, PDV, Caixa, Tutores, Animais, Agenda, Atendimentos
  INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES
    (r_atendente, 'dashboard', true, false, false, false),
    (r_atendente, 'sales', true, true, true, false),
    (r_atendente, 'pdv', true, true, true, false),
    (r_atendente, 'cash_register', true, true, true, false),
    (r_atendente, 'customers', true, true, true, false),
    (r_atendente, 'pets', true, true, true, false),
    (r_atendente, 'products', false, false, false, false),
    (r_atendente, 'services', false, false, false, false),
    (r_atendente, 'professionals', false, false, false, false),
    (r_atendente, 'suppliers', false, false, false, false),
    (r_atendente, 'schedule', true, true, true, false),
    (r_atendente, 'service_orders', true, true, true, false),
    (r_atendente, 'stock', false, false, false, false),
    (r_atendente, 'purchases', false, false, false, false),
    (r_atendente, 'financial', false, false, false, false),
    (r_atendente, 'reports', false, false, false, false),
    (r_atendente, 'users', false, false, false, false),
    (r_atendente, 'settings', false, false, false, false),
    (r_atendente, 'license', false, false, false, false)
  ON CONFLICT (role_id, module) DO NOTHING;

  -- BANHISTA: Agenda, Atendimentos, Animais
  INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES
    (r_banhista, 'dashboard', false, false, false, false),
    (r_banhista, 'sales', false, false, false, false),
    (r_banhista, 'pdv', false, false, false, false),
    (r_banhista, 'cash_register', false, false, false, false),
    (r_banhista, 'customers', false, false, false, false),
    (r_banhista, 'pets', true, false, false, false),
    (r_banhista, 'products', false, false, false, false),
    (r_banhista, 'services', false, false, false, false),
    (r_banhista, 'professionals', false, false, false, false),
    (r_banhista, 'suppliers', false, false, false, false),
    (r_banhista, 'schedule', true, true, true, false),
    (r_banhista, 'service_orders', true, true, true, false),
    (r_banhista, 'stock', false, false, false, false),
    (r_banhista, 'purchases', false, false, false, false),
    (r_banhista, 'financial', false, false, false, false),
    (r_banhista, 'reports', false, false, false, false),
    (r_banhista, 'users', false, false, false, false),
    (r_banhista, 'settings', false, false, false, false),
    (r_banhista, 'license', false, false, false, false)
  ON CONFLICT (role_id, module) DO NOTHING;

  -- ESTOQUISTA: Produtos, Fornecedores, Estoque, Compras
  INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES
    (r_estoquista, 'dashboard', false, false, false, false),
    (r_estoquista, 'sales', false, false, false, false),
    (r_estoquista, 'pdv', false, false, false, false),
    (r_estoquista, 'cash_register', false, false, false, false),
    (r_estoquista, 'customers', false, false, false, false),
    (r_estoquista, 'pets', false, false, false, false),
    (r_estoquista, 'products', true, true, true, true),
    (r_estoquista, 'services', false, false, false, false),
    (r_estoquista, 'professionals', false, false, false, false),
    (r_estoquista, 'suppliers', true, true, true, true),
    (r_estoquista, 'schedule', false, false, false, false),
    (r_estoquista, 'service_orders', false, false, false, false),
    (r_estoquista, 'stock', true, true, true, true),
    (r_estoquista, 'purchases', true, true, true, true),
    (r_estoquista, 'financial', false, false, false, false),
    (r_estoquista, 'reports', false, false, false, false),
    (r_estoquista, 'users', false, false, false, false),
    (r_estoquista, 'settings', false, false, false, false),
    (r_estoquista, 'license', false, false, false, false)
  ON CONFLICT (role_id, module) DO NOTHING;

  -- FINANCEIRO: Caixa, Financeiro, Relatórios, Fornecedores, Compras
  INSERT INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete) VALUES
    (r_financeiro, 'dashboard', false, false, false, false),
    (r_financeiro, 'sales', false, false, false, false),
    (r_financeiro, 'pdv', false, false, false, false),
    (r_financeiro, 'cash_register', true, true, true, false),
    (r_financeiro, 'customers', false, false, false, false),
    (r_financeiro, 'pets', false, false, false, false),
    (r_financeiro, 'products', false, false, false, false),
    (r_financeiro, 'services', false, false, false, false),
    (r_financeiro, 'professionals', false, false, false, false),
    (r_financeiro, 'suppliers', true, true, true, false),
    (r_financeiro, 'schedule', false, false, false, false),
    (r_financeiro, 'service_orders', false, false, false, false),
    (r_financeiro, 'stock', false, false, false, false),
    (r_financeiro, 'purchases', true, true, true, false),
    (r_financeiro, 'financial', true, true, true, true),
    (r_financeiro, 'reports', true, false, false, false),
    (r_financeiro, 'users', false, false, false, false),
    (r_financeiro, 'settings', false, false, false, false),
    (r_financeiro, 'license', false, false, false, false)
  ON CONFLICT (role_id, module) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger: ao criar um novo estabelecimento, cria roles padrão automaticamente
CREATE OR REPLACE FUNCTION trigger_create_default_roles()
RETURNS trigger AS $$
BEGIN
  PERFORM create_default_roles_for_establishment(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_establishment_created ON establishments;
CREATE TRIGGER on_establishment_created
  AFTER INSERT ON establishments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_roles();

-- 7. Criar roles para estabelecimentos existentes que ainda não têm
DO $$
DECLARE
  est RECORD;
BEGIN
  FOR est IN SELECT id FROM establishments LOOP
    PERFORM create_default_roles_for_establishment(est.id);
  END LOOP;
END $$;

-- 8. RLS Policies para role_permissions e member_permission_overrides
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view role_permissions of their establishment"
  ON role_permissions FOR SELECT
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      JOIN memberships m ON m.establishment_id = r.establishment_id
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
  );

CREATE POLICY "Owners can manage role_permissions"
  ON role_permissions FOR ALL
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      JOIN memberships m ON m.establishment_id = r.establishment_id
      JOIN roles ur ON ur.id = m.role_id
      WHERE m.user_id = auth.uid() AND m.status = 'active' AND ur.is_owner = true
    )
  );

CREATE POLICY "Users can view their own permission overrides"
  ON member_permission_overrides FOR SELECT
  USING (
    membership_id IN (
      SELECT id FROM memberships WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Owners can manage permission overrides"
  ON member_permission_overrides FOR ALL
  USING (
    membership_id IN (
      SELECT m.id FROM memberships m
      JOIN memberships owner_m ON owner_m.establishment_id = m.establishment_id
      JOIN roles r ON r.id = owner_m.role_id
      WHERE owner_m.user_id = auth.uid() AND owner_m.status = 'active' AND r.is_owner = true
    )
  );

-- ============================================================
-- FIM DA MIGRAÇÃO RBAC
-- ============================================================
