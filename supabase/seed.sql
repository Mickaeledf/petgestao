-- =============================================================
-- PetGestão - Seed Data
-- Pet shop pequeno (~R$5k/mês, 3 funcionários)
-- =============================================================

-- Busca o establishment do usuário atual
DO $$
DECLARE
  v_est_id UUID;
  v_user_id UUID := 'ee26c7d0-db49-4adf-875c-e94835a48566';
  v_role_proprietario UUID := '7af63af3-7953-4256-8789-dc7b00e8cd3e';

  -- Categorias
  v_cat_racao UUID;
  v_cat_higiene UUID;
  v_cat_acessorios UUID;
  v_cat_medicamentos UUID;
  v_cat_petiscos UUID;

  -- Produtos
  v_prod_racao_premium UUID;
  v_prod_racao_filhote UUID;
  v_prod_racao_gato UUID;
  v_prod_shampoo UUID;
  v_prod_condicionador UUID;
  v_prod_perfume UUID;
  v_prod_coleira UUID;
  v_prod_guia UUID;
  v_prod_brinquedo UUID;
  v_prod_vermifugo UUID;
  v_prod_antipulgas UUID;
  v_prod_petisco UUID;
  v_prod_ossinho UUID;
  v_prod_tapete UUID;
  v_prod_comedouro UUID;

  -- Clientes (Tutores)
  v_cli_maria UUID;
  v_cli_joao UUID;
  v_cli_ana UUID;
  v_cli_carlos UUID;
  v_cli_fernanda UUID;
  v_cli_roberto UUID;
  v_cli_lucia UUID;
  v_cli_pedro UUID;
  v_cli_juliana UUID;
  v_cli_marcos UUID;

  -- Pets
  v_pet_rex UUID;
  v_pet_mel UUID;
  v_pet_thor UUID;
  v_pet_luna UUID;
  v_pet_bob UUID;
  v_pet_mia UUID;
  v_pet_max UUID;
  v_pet_nina UUID;
  v_pet_buddy UUID;
  v_pet_lola UUID;
  v_pet_simba UUID;
  v_pet_pipoca UUID;

  -- Fornecedores
  v_sup_distribuidora UUID;
  v_sup_racao UUID;
  v_sup_acessorios UUID;

  -- Serviços
  v_svc_banho_p UUID;
  v_svc_banho_m UUID;
  v_svc_banho_g UUID;
  v_svc_tosa_higienica UUID;
  v_svc_tosa_completa UUID;
  v_svc_hidratacao UUID;
  v_svc_banho_gato UUID;
  v_svc_tosa_tesoura UUID;

  -- Profissionais
  v_prof_camila UUID;
  v_prof_lucas UUID;
  v_prof_patricia UUID;

  -- Vendas
  v_sale UUID;

  -- Ordens de serviço
  v_so UUID;

  -- Compras
  v_purchase UUID;

BEGIN
  -- Pega o establishment existente
  SELECT e.id INTO v_est_id
  FROM establishments e
  JOIN memberships m ON m.establishment_id = e.id
  WHERE m.user_id = v_user_id
  LIMIT 1;

  IF v_est_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum establishment encontrado para o usuário';
  END IF;

  -- =============================================================
  -- CATEGORIAS
  -- =============================================================
  INSERT INTO categories (id, establishment_id, name, description) VALUES
    (uuid_generate_v4(), v_est_id, 'Rações', 'Rações para cães e gatos')
  RETURNING id INTO v_cat_racao;

  INSERT INTO categories (id, establishment_id, name, description) VALUES
    (uuid_generate_v4(), v_est_id, 'Higiene e Beleza', 'Shampoos, condicionadores e perfumes')
  RETURNING id INTO v_cat_higiene;

  INSERT INTO categories (id, establishment_id, name, description) VALUES
    (uuid_generate_v4(), v_est_id, 'Acessórios', 'Coleiras, guias e brinquedos')
  RETURNING id INTO v_cat_acessorios;

  INSERT INTO categories (id, establishment_id, name, description) VALUES
    (uuid_generate_v4(), v_est_id, 'Medicamentos', 'Vermífugos e antipulgas')
  RETURNING id INTO v_cat_medicamentos;

  INSERT INTO categories (id, establishment_id, name, description) VALUES
    (uuid_generate_v4(), v_est_id, 'Petiscos', 'Petiscos e ossinhos')
  RETURNING id INTO v_cat_petiscos;

  -- =============================================================
  -- PRODUTOS (15 produtos típicos de pet shop pequeno)
  -- =============================================================
  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_racao, 'Ração Premium Adulto 15kg', 'Ração para cães adultos porte médio', '7891234560001', 'Golden', 'unidade', 89.90, 139.90, 3)
  RETURNING id INTO v_prod_racao_premium;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_racao, 'Ração Filhote 10kg', 'Ração para filhotes todas as raças', '7891234560002', 'Royal Canin', 'unidade', 119.90, 189.90, 2)
  RETURNING id INTO v_prod_racao_filhote;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_racao, 'Ração Gato Adulto 10kg', 'Ração para gatos adultos castrados', '7891234560003', 'Whiskas', 'unidade', 74.90, 119.90, 2)
  RETURNING id INTO v_prod_racao_gato;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_higiene, 'Shampoo Neutro 500ml', 'Shampoo neutro para cães e gatos', '7891234560004', 'Sanol', 'unidade', 8.50, 18.90, 5)
  RETURNING id INTO v_prod_shampoo;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_higiene, 'Condicionador 500ml', 'Condicionador desembaraçador', '7891234560005', 'Sanol', 'unidade', 9.90, 21.90, 5)
  RETURNING id INTO v_prod_condicionador;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_higiene, 'Perfume Canino 120ml', 'Colônia para cães', '7891234560006', 'Pet Clean', 'unidade', 6.50, 15.90, 4)
  RETURNING id INTO v_prod_perfume;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_acessorios, 'Coleira Nylon M', 'Coleira ajustável nylon tamanho M', '7891234560007', 'São Pet', 'unidade', 5.90, 14.90, 6)
  RETURNING id INTO v_prod_coleira;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_acessorios, 'Guia Retrátil 5m', 'Guia retrátil para passeio', '7891234560008', 'Chalesco', 'unidade', 22.90, 49.90, 3)
  RETURNING id INTO v_prod_guia;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_acessorios, 'Brinquedo Mordedor', 'Brinquedo mordedor de borracha', '7891234560009', 'Jambo', 'unidade', 7.50, 19.90, 8)
  RETURNING id INTO v_prod_brinquedo;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_medicamentos, 'Vermífugo Comprimido', 'Vermífugo para cães até 30kg', '7891234560010', 'Drontal', 'unidade', 12.90, 29.90, 10)
  RETURNING id INTO v_prod_vermifugo;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_medicamentos, 'Antipulgas Pipeta', 'Antipulgas e carrapatos pipeta', '7891234560011', 'Frontline', 'unidade', 28.90, 54.90, 8)
  RETURNING id INTO v_prod_antipulgas;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_petiscos, 'Petisco Bifinho 500g', 'Bifinho sabor carne para cães', '7891234560012', 'Pedigree', 'unidade', 8.90, 16.90, 6)
  RETURNING id INTO v_prod_petisco;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_petiscos, 'Ossinho Natural M', 'Osso natural defumado tamanho M', '7891234560013', 'Pet Pira', 'unidade', 3.50, 8.90, 10)
  RETURNING id INTO v_prod_ossinho;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_higiene, 'Tapete Higiênico 30un', 'Tapete higiênico descartável', '7891234560014', 'Pet Society', 'unidade', 18.90, 34.90, 4)
  RETURNING id INTO v_prod_tapete;

  INSERT INTO products (id, establishment_id, category_id, name, description, barcode, brand, unit, cost_price, sale_price, minimum_stock) VALUES
    (uuid_generate_v4(), v_est_id, v_cat_acessorios, 'Comedouro Inox M', 'Comedouro de inox antiderrapante', '7891234560015', 'Jambo', 'unidade', 9.90, 24.90, 5)
  RETURNING id INTO v_prod_comedouro;

  -- =============================================================
  -- ESTOQUE INICIAL
  -- =============================================================
  INSERT INTO stock_balances (id, establishment_id, product_id, quantity) VALUES
    (uuid_generate_v4(), v_est_id, v_prod_racao_premium, 8),
    (uuid_generate_v4(), v_est_id, v_prod_racao_filhote, 5),
    (uuid_generate_v4(), v_est_id, v_prod_racao_gato, 4),
    (uuid_generate_v4(), v_est_id, v_prod_shampoo, 12),
    (uuid_generate_v4(), v_est_id, v_prod_condicionador, 10),
    (uuid_generate_v4(), v_est_id, v_prod_perfume, 8),
    (uuid_generate_v4(), v_est_id, v_prod_coleira, 15),
    (uuid_generate_v4(), v_est_id, v_prod_guia, 6),
    (uuid_generate_v4(), v_est_id, v_prod_brinquedo, 20),
    (uuid_generate_v4(), v_est_id, v_prod_vermifugo, 18),
    (uuid_generate_v4(), v_est_id, v_prod_antipulgas, 12),
    (uuid_generate_v4(), v_est_id, v_prod_petisco, 15),
    (uuid_generate_v4(), v_est_id, v_prod_ossinho, 25),
    (uuid_generate_v4(), v_est_id, v_prod_tapete, 8),
    (uuid_generate_v4(), v_est_id, v_prod_comedouro, 10);

  -- Movimentações iniciais de estoque
  INSERT INTO stock_movements (id, establishment_id, product_id, movement_type, quantity, reason, created_by) VALUES
    (uuid_generate_v4(), v_est_id, v_prod_racao_premium, 'initial', 8, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_racao_filhote, 'initial', 5, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_racao_gato, 'initial', 4, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_shampoo, 'initial', 12, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_condicionador, 'initial', 10, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_perfume, 'initial', 8, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_coleira, 'initial', 15, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_guia, 'initial', 6, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_brinquedo, 'initial', 20, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_vermifugo, 'initial', 18, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_antipulgas, 'initial', 12, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_petisco, 'initial', 15, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_ossinho, 'initial', 25, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_tapete, 'initial', 8, 'Estoque inicial', v_user_id),
    (uuid_generate_v4(), v_est_id, v_prod_comedouro, 'initial', 10, 'Estoque inicial', v_user_id);

  -- =============================================================
  -- CLIENTES (TUTORES) - 10 clientes típicos
  -- =============================================================
  INSERT INTO customers (id, establishment_id, name, phone, email, document, notes) VALUES
    (uuid_generate_v4(), v_est_id, 'Maria Silva', '(11) 99876-5432', 'maria.silva@email.com', '123.456.789-00', 'Cliente fiel, vem toda semana')
  RETURNING id INTO v_cli_maria;

  INSERT INTO customers (id, establishment_id, name, phone, email, document) VALUES
    (uuid_generate_v4(), v_est_id, 'João Santos', '(11) 98765-4321', 'joao.santos@email.com', '234.567.890-11')
  RETURNING id INTO v_cli_joao;

  INSERT INTO customers (id, establishment_id, name, phone, email) VALUES
    (uuid_generate_v4(), v_est_id, 'Ana Oliveira', '(11) 97654-3210', 'ana.oliveira@email.com')
  RETURNING id INTO v_cli_ana;

  INSERT INTO customers (id, establishment_id, name, phone, document) VALUES
    (uuid_generate_v4(), v_est_id, 'Carlos Pereira', '(11) 96543-2109', '345.678.901-22')
  RETURNING id INTO v_cli_carlos;

  INSERT INTO customers (id, establishment_id, name, phone, email, notes) VALUES
    (uuid_generate_v4(), v_est_id, 'Fernanda Costa', '(11) 95432-1098', 'fernanda.costa@email.com', 'Prefere horário pela manhã')
  RETURNING id INTO v_cli_fernanda;

  INSERT INTO customers (id, establishment_id, name, phone) VALUES
    (uuid_generate_v4(), v_est_id, 'Roberto Almeida', '(11) 94321-0987')
  RETURNING id INTO v_cli_roberto;

  INSERT INTO customers (id, establishment_id, name, phone, email) VALUES
    (uuid_generate_v4(), v_est_id, 'Lúcia Ferreira', '(11) 93210-9876', 'lucia.ferreira@email.com')
  RETURNING id INTO v_cli_lucia;

  INSERT INTO customers (id, establishment_id, name, phone) VALUES
    (uuid_generate_v4(), v_est_id, 'Pedro Martins', '(11) 92109-8765')
  RETURNING id INTO v_cli_pedro;

  INSERT INTO customers (id, establishment_id, name, phone, email, document) VALUES
    (uuid_generate_v4(), v_est_id, 'Juliana Souza', '(11) 91098-7654', 'juliana.souza@email.com', '456.789.012-33')
  RETURNING id INTO v_cli_juliana;

  INSERT INTO customers (id, establishment_id, name, phone, notes) VALUES
    (uuid_generate_v4(), v_est_id, 'Marcos Lima', '(11) 90987-6543', 'Sempre traz 2 cães juntos')
  RETURNING id INTO v_cli_marcos;

  -- =============================================================
  -- PETS - 12 animais (mistura de cães e gatos)
  -- =============================================================
  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_maria, 'Rex', 'Cão', 'Pastor Alemão', 'Macho', '2021-03-15', 'grande', 'Preto e marrom', 32.5)
  RETURNING id INTO v_pet_rex;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_maria, 'Mel', 'Cão', 'Golden Retriever', 'Fêmea', '2022-07-20', 'grande', 'Dourado', 28.0)
  RETURNING id INTO v_pet_mel;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_joao, 'Thor', 'Cão', 'Bulldog Francês', 'Macho', '2023-01-10', 'pequeno', 'Tigrado', 11.5)
  RETURNING id INTO v_pet_thor;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_ana, 'Luna', 'Cão', 'Shih Tzu', 'Fêmea', '2022-11-05', 'pequeno', 'Branco e marrom', 5.8)
  RETURNING id INTO v_pet_luna;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_carlos, 'Bob', 'Cão', 'Labrador', 'Macho', '2020-06-18', 'grande', 'Chocolate', 34.0)
  RETURNING id INTO v_pet_bob;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_fernanda, 'Mia', 'Gato', 'Persa', 'Fêmea', '2023-04-12', 'pequeno', 'Branco', 4.2)
  RETURNING id INTO v_pet_mia;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_roberto, 'Max', 'Cão', 'Poodle', 'Macho', '2021-09-25', 'medio', 'Branco', 8.5)
  RETURNING id INTO v_pet_max;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_lucia, 'Nina', 'Cão', 'Yorkshire', 'Fêmea', '2022-02-14', 'mini', 'Preto e dourado', 3.2)
  RETURNING id INTO v_pet_nina;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_pedro, 'Buddy', 'Cão', 'SRD', 'Macho', '2020-12-01', 'medio', 'Caramelo', 15.0)
  RETURNING id INTO v_pet_buddy;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_juliana, 'Lola', 'Cão', 'Lhasa Apso', 'Fêmea', '2023-06-30', 'pequeno', 'Branco e cinza', 6.0)
  RETURNING id INTO v_pet_lola;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_marcos, 'Simba', 'Gato', 'Maine Coon', 'Macho', '2022-08-10', 'grande', 'Laranja tigrado', 7.5)
  RETURNING id INTO v_pet_simba;

  INSERT INTO pets (id, establishment_id, customer_id, name, species, breed, sex, birth_date, size, color, weight) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_marcos, 'Pipoca', 'Cão', 'Spitz Alemão', 'Fêmea', '2023-03-22', 'mini', 'Branco', 3.5)
  RETURNING id INTO v_pet_pipoca;

  -- =============================================================
  -- FORNECEDORES
  -- =============================================================
  INSERT INTO suppliers (id, establishment_id, name, document, phone, email, contact_name) VALUES
    (uuid_generate_v4(), v_est_id, 'Distribuidora PetFort', '12.345.678/0001-90', '(11) 3456-7890', 'vendas@petfort.com.br', 'Carlos Distribuidor')
  RETURNING id INTO v_sup_distribuidora;

  INSERT INTO suppliers (id, establishment_id, name, phone, email, contact_name) VALUES
    (uuid_generate_v4(), v_est_id, 'Rações Premium SP', '(11) 3567-8901', 'contato@racoespremium.com.br', 'Sandra Vendas')
  RETURNING id INTO v_sup_racao;

  INSERT INTO suppliers (id, establishment_id, name, phone, contact_name) VALUES
    (uuid_generate_v4(), v_est_id, 'Acessórios Pet Center', '(11) 3678-9012', 'Fernando')
  RETURNING id INTO v_sup_acessorios;

  -- =============================================================
  -- SERVIÇOS (preços típicos de pet shop pequeno em SP)
  -- =============================================================
  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Banho Pequeno Porte', 'Banho completo para cães de pequeno porte (até 10kg)', 45.00, 45)
  RETURNING id INTO v_svc_banho_p;

  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Banho Médio Porte', 'Banho completo para cães de médio porte (10-25kg)', 55.00, 60)
  RETURNING id INTO v_svc_banho_m;

  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Banho Grande Porte', 'Banho completo para cães de grande porte (acima de 25kg)', 70.00, 75)
  RETURNING id INTO v_svc_banho_g;

  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Tosa Higiênica', 'Tosa das patas, barriga e região sanitária', 30.00, 30)
  RETURNING id INTO v_svc_tosa_higienica;

  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Tosa Completa', 'Tosa na máquina corpo inteiro + acabamento', 60.00, 60)
  RETURNING id INTO v_svc_tosa_completa;

  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Hidratação', 'Tratamento de hidratação profunda para pelos', 25.00, 20)
  RETURNING id INTO v_svc_hidratacao;

  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Banho Felino', 'Banho especial para gatos com secagem', 60.00, 45)
  RETURNING id INTO v_svc_banho_gato;

  INSERT INTO services (id, establishment_id, name, description, base_price, duration_minutes) VALUES
    (uuid_generate_v4(), v_est_id, 'Tosa na Tesoura', 'Tosa artística na tesoura', 80.00, 90)
  RETURNING id INTO v_svc_tosa_tesoura;

  -- =============================================================
  -- PROFISSIONAIS (3 funcionários)
  -- =============================================================
  INSERT INTO professionals (id, establishment_id, name, phone) VALUES
    (uuid_generate_v4(), v_est_id, 'Camila Banhista', '(11) 99111-2222')
  RETURNING id INTO v_prof_camila;

  INSERT INTO professionals (id, establishment_id, name, phone) VALUES
    (uuid_generate_v4(), v_est_id, 'Lucas Tosador', '(11) 99333-4444')
  RETURNING id INTO v_prof_lucas;

  INSERT INTO professionals (id, establishment_id, name, phone) VALUES
    (uuid_generate_v4(), v_est_id, 'Patrícia Auxiliar', '(11) 99555-6666')
  RETURNING id INTO v_prof_patricia;

  -- Associar profissionais aos serviços
  INSERT INTO professional_services (professional_id, service_id) VALUES
    (v_prof_camila, v_svc_banho_p),
    (v_prof_camila, v_svc_banho_m),
    (v_prof_camila, v_svc_banho_g),
    (v_prof_camila, v_svc_hidratacao),
    (v_prof_camila, v_svc_banho_gato),
    (v_prof_lucas, v_svc_tosa_higienica),
    (v_prof_lucas, v_svc_tosa_completa),
    (v_prof_lucas, v_svc_tosa_tesoura),
    (v_prof_lucas, v_svc_banho_m),
    (v_prof_lucas, v_svc_banho_g),
    (v_prof_patricia, v_svc_banho_p),
    (v_prof_patricia, v_svc_banho_m),
    (v_prof_patricia, v_svc_tosa_higienica),
    (v_prof_patricia, v_svc_hidratacao);

  -- =============================================================
  -- VENDAS RECENTES (simulando ~R$5k/mês, R$3k num dia bom)
  -- Últimos 30 dias de vendas
  -- =============================================================

  -- Venda 1 - Maria: Ração + Petisco (ontem)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_maria, 'completed', 156.80, 156.80, v_user_id, now() - interval '1 day', now() - interval '1 day')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, product_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_prod_racao_premium, 'product', 'Ração Premium Adulto 15kg', 1, 139.90, 139.90),
    (uuid_generate_v4(), v_sale, v_prod_petisco, 'product', 'Petisco Bifinho 500g', 1, 16.90, 16.90);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'pix', 156.80);

  -- Venda 2 - João: Banho + Tosa (ontem)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_joao, 'completed', 75.00, 75.00, v_user_id, now() - interval '1 day', now() - interval '1 day')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_svc_banho_p, 'service', 'Banho Pequeno Porte', 1, 45.00, 45.00),
    (uuid_generate_v4(), v_sale, v_svc_tosa_higienica, 'service', 'Tosa Higiênica', 1, 30.00, 30.00);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'credito', 75.00);

  -- Venda 3 - Ana: Antipulgas + Vermífugo (2 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_ana, 'completed', 84.80, 84.80, v_user_id, now() - interval '2 days', now() - interval '2 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, product_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_prod_antipulgas, 'product', 'Antipulgas Pipeta', 1, 54.90, 54.90),
    (uuid_generate_v4(), v_sale, v_prod_vermifugo, 'product', 'Vermífugo Comprimido', 1, 29.90, 29.90);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'debito', 84.80);

  -- Venda 4 - Carlos: Banho grande porte + Hidratação (3 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_carlos, 'completed', 95.00, 95.00, v_user_id, now() - interval '3 days', now() - interval '3 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_svc_banho_g, 'service', 'Banho Grande Porte', 1, 70.00, 70.00),
    (uuid_generate_v4(), v_sale, v_svc_hidratacao, 'service', 'Hidratação', 1, 25.00, 25.00);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'dinheiro', 95.00);

  -- Venda 5 - Fernanda: Banho gato + Coleira + Brinquedo (3 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_fernanda, 'completed', 94.80, 94.80, v_user_id, now() - interval '3 days', now() - interval '3 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_svc_banho_gato, 'service', 'Banho Felino', 1, 60.00, 60.00);
  INSERT INTO sale_items (id, sale_id, product_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_prod_coleira, 'product', 'Coleira Nylon M', 1, 14.90, 14.90),
    (uuid_generate_v4(), v_sale, v_prod_brinquedo, 'product', 'Brinquedo Mordedor', 1, 19.90, 19.90);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'pix', 94.80);

  -- Venda 6 - Roberto: Ração filhote (5 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_roberto, 'completed', 189.90, 189.90, v_user_id, now() - interval '5 days', now() - interval '5 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, product_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_prod_racao_filhote, 'product', 'Ração Filhote 10kg', 1, 189.90, 189.90);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'credito', 189.90);

  -- Venda 7 - Lúcia: Banho + Tosa tesoura (7 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_lucia, 'completed', 125.00, 125.00, v_user_id, now() - interval '7 days', now() - interval '7 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_svc_banho_p, 'service', 'Banho Pequeno Porte', 1, 45.00, 45.00),
    (uuid_generate_v4(), v_sale, v_svc_tosa_tesoura, 'service', 'Tosa na Tesoura', 1, 80.00, 80.00);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'pix', 125.00);

  -- Venda 8 - Pedro: Guia + Ossinho + Tapete (10 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_pedro, 'completed', 93.70, 93.70, v_user_id, now() - interval '10 days', now() - interval '10 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, product_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_prod_guia, 'product', 'Guia Retrátil 5m', 1, 49.90, 49.90),
    (uuid_generate_v4(), v_sale, v_prod_ossinho, 'product', 'Ossinho Natural M', 2, 8.90, 17.80),
    (uuid_generate_v4(), v_sale, v_prod_tapete, 'product', 'Tapete Higiênico 30un', 1, 34.90, 34.90);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'dinheiro', 100.00);

  -- Venda 9 - Juliana: Banho + Tosa completa (12 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_juliana, 'completed', 105.00, 105.00, v_user_id, now() - interval '12 days', now() - interval '12 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_svc_banho_p, 'service', 'Banho Pequeno Porte', 1, 45.00, 45.00),
    (uuid_generate_v4(), v_sale, v_svc_tosa_completa, 'service', 'Tosa Completa', 1, 60.00, 60.00);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'credito', 105.00);

  -- Venda 10 - Marcos: Ração gato + Ração premium + Comedouro (15 dias atrás)
  INSERT INTO sales (id, establishment_id, customer_id, status, subtotal, total, sold_by, completed_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_marcos, 'completed', 284.70, 284.70, v_user_id, now() - interval '15 days', now() - interval '15 days')
  RETURNING id INTO v_sale;

  INSERT INTO sale_items (id, sale_id, product_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_sale, v_prod_racao_gato, 'product', 'Ração Gato Adulto 10kg', 1, 119.90, 119.90),
    (uuid_generate_v4(), v_sale, v_prod_racao_premium, 'product', 'Ração Premium Adulto 15kg', 1, 139.90, 139.90),
    (uuid_generate_v4(), v_sale, v_prod_comedouro, 'product', 'Comedouro Inox M', 1, 24.90, 24.90);

  INSERT INTO sale_payments (id, sale_id, method, amount) VALUES
    (uuid_generate_v4(), v_sale, 'pix', 284.70);

  -- =============================================================
  -- AGENDAMENTOS (próximos dias)
  -- =============================================================
  INSERT INTO appointments (id, establishment_id, customer_id, pet_id, professional_id, service_id, date, start_time, status, price, created_by) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_maria, v_pet_rex, v_prof_camila, v_svc_banho_g, CURRENT_DATE + 1, '09:00', 'scheduled', 70.00, v_user_id),
    (uuid_generate_v4(), v_est_id, v_cli_maria, v_pet_mel, v_prof_lucas, v_svc_tosa_completa, CURRENT_DATE + 1, '09:00', 'scheduled', 60.00, v_user_id),
    (uuid_generate_v4(), v_est_id, v_cli_joao, v_pet_thor, v_prof_camila, v_svc_banho_p, CURRENT_DATE + 1, '10:00', 'confirmed', 45.00, v_user_id),
    (uuid_generate_v4(), v_est_id, v_cli_ana, v_pet_luna, v_prof_patricia, v_svc_banho_p, CURRENT_DATE + 1, '11:00', 'scheduled', 45.00, v_user_id),
    (uuid_generate_v4(), v_est_id, v_cli_lucia, v_pet_nina, v_prof_lucas, v_svc_tosa_tesoura, CURRENT_DATE + 2, '09:00', 'scheduled', 80.00, v_user_id),
    (uuid_generate_v4(), v_est_id, v_cli_roberto, v_pet_max, v_prof_camila, v_svc_banho_m, CURRENT_DATE + 2, '10:00', 'scheduled', 55.00, v_user_id),
    (uuid_generate_v4(), v_est_id, v_cli_fernanda, v_pet_mia, v_prof_patricia, v_svc_banho_gato, CURRENT_DATE + 3, '09:00', 'scheduled', 60.00, v_user_id),
    (uuid_generate_v4(), v_est_id, v_cli_marcos, v_pet_pipoca, v_prof_camila, v_svc_banho_p, CURRENT_DATE + 3, '14:00', 'scheduled', 45.00, v_user_id);

  -- =============================================================
  -- ORDENS DE SERVIÇO (últimos dias - concluídas)
  -- =============================================================
  INSERT INTO service_orders (id, establishment_id, customer_id, pet_id, professional_id, status, total, started_at, completed_at, delivered_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_carlos, v_pet_bob, v_prof_camila, 'delivered', 95.00, now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days')
  RETURNING id INTO v_so;

  INSERT INTO service_order_items (id, service_order_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_so, v_svc_banho_g, 'service', 'Banho Grande Porte', 1, 70.00, 70.00),
    (uuid_generate_v4(), v_so, v_svc_hidratacao, 'service', 'Hidratação', 1, 25.00, 25.00);

  INSERT INTO service_orders (id, establishment_id, customer_id, pet_id, professional_id, status, total, started_at, completed_at, delivered_at, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_juliana, v_pet_lola, v_prof_lucas, 'delivered', 105.00, now() - interval '5 days', now() - interval '5 days', now() - interval '5 days', now() - interval '5 days')
  RETURNING id INTO v_so;

  INSERT INTO service_order_items (id, service_order_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_so, v_svc_banho_p, 'service', 'Banho Pequeno Porte', 1, 45.00, 45.00),
    (uuid_generate_v4(), v_so, v_svc_tosa_completa, 'service', 'Tosa Completa', 1, 60.00, 60.00);

  INSERT INTO service_orders (id, establishment_id, customer_id, pet_id, professional_id, status, total, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_cli_marcos, v_pet_pipoca, v_prof_patricia, 'pending', 70.00, now() - interval '1 day')
  RETURNING id INTO v_so;

  INSERT INTO service_order_items (id, service_order_id, service_id, item_type, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_so, v_svc_banho_p, 'service', 'Banho Pequeno Porte', 1, 45.00, 45.00),
    (uuid_generate_v4(), v_so, v_svc_hidratacao, 'service', 'Hidratação', 1, 25.00, 25.00);

  -- =============================================================
  -- COMPRAS DE FORNECEDORES (últimas compras)
  -- =============================================================
  INSERT INTO purchases (id, establishment_id, supplier_id, status, total, notes, expected_date, received_at, created_by, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_sup_distribuidora, 'received', 425.50, 'Reposição mensal de higiene', CURRENT_DATE - 5, now() - interval '5 days', v_user_id, now() - interval '10 days')
  RETURNING id INTO v_purchase;

  INSERT INTO purchase_items (id, purchase_id, product_id, description, quantity, unit_price, total, received_quantity) VALUES
    (uuid_generate_v4(), v_purchase, v_prod_shampoo, 'Shampoo Neutro 500ml', 12, 8.50, 102.00, 12),
    (uuid_generate_v4(), v_purchase, v_prod_condicionador, 'Condicionador 500ml', 10, 9.90, 99.00, 10),
    (uuid_generate_v4(), v_purchase, v_prod_perfume, 'Perfume Canino 120ml', 8, 6.50, 52.00, 8),
    (uuid_generate_v4(), v_purchase, v_prod_tapete, 'Tapete Higiênico 30un', 6, 18.90, 113.40, 6),
    (uuid_generate_v4(), v_purchase, v_prod_ossinho, 'Ossinho Natural M', 10, 3.50, 35.00, 10),
    (uuid_generate_v4(), v_purchase, v_prod_petisco, 'Petisco Bifinho 500g', 4, 8.90, 35.60, 0);

  INSERT INTO purchases (id, establishment_id, supplier_id, status, total, notes, expected_date, created_by, created_at) VALUES
    (uuid_generate_v4(), v_est_id, v_sup_racao, 'pending', 1049.10, 'Pedido de rações do mês', CURRENT_DATE + 3, v_user_id, now() - interval '2 days')
  RETURNING id INTO v_purchase;

  INSERT INTO purchase_items (id, purchase_id, product_id, description, quantity, unit_price, total) VALUES
    (uuid_generate_v4(), v_purchase, v_prod_racao_premium, 'Ração Premium Adulto 15kg', 5, 89.90, 449.50),
    (uuid_generate_v4(), v_purchase, v_prod_racao_filhote, 'Ração Filhote 10kg', 3, 119.90, 359.70),
    (uuid_generate_v4(), v_purchase, v_prod_racao_gato, 'Ração Gato Adulto 10kg', 2, 74.90, 149.80);

  -- =============================================================
  -- LANÇAMENTOS FINANCEIROS
  -- =============================================================
  INSERT INTO financial_transactions (id, establishment_id, type, category, description, amount, due_date, paid_date, status, payment_method, created_by) VALUES
    (uuid_generate_v4(), v_est_id, 'expense', 'Aluguel', 'Aluguel do mês - Outubro', 1800.00, CURRENT_DATE - 5, CURRENT_DATE - 5, 'paid', 'pix', v_user_id),
    (uuid_generate_v4(), v_est_id, 'expense', 'Energia', 'Conta de luz - Outubro', 320.00, CURRENT_DATE - 3, CURRENT_DATE - 3, 'paid', 'pix', v_user_id),
    (uuid_generate_v4(), v_est_id, 'expense', 'Água', 'Conta de água - Outubro', 95.00, CURRENT_DATE + 5, NULL, 'pending', NULL, v_user_id),
    (uuid_generate_v4(), v_est_id, 'expense', 'Salários', 'Salário Camila - Outubro', 1600.00, CURRENT_DATE + 5, NULL, 'pending', NULL, v_user_id),
    (uuid_generate_v4(), v_est_id, 'expense', 'Salários', 'Salário Lucas - Outubro', 1600.00, CURRENT_DATE + 5, NULL, 'pending', NULL, v_user_id),
    (uuid_generate_v4(), v_est_id, 'expense', 'Salários', 'Salário Patrícia - Outubro', 1400.00, CURRENT_DATE + 5, NULL, 'pending', NULL, v_user_id),
    (uuid_generate_v4(), v_est_id, 'expense', 'Fornecedores', 'Reposição produtos higiene', 425.50, CURRENT_DATE - 5, CURRENT_DATE - 5, 'paid', 'pix', v_user_id),
    (uuid_generate_v4(), v_est_id, 'expense', 'Internet', 'Internet e telefone', 149.90, CURRENT_DATE + 10, NULL, 'pending', NULL, v_user_id),
    (uuid_generate_v4(), v_est_id, 'income', 'Vendas', 'Receita vendas semana 1 Out', 1280.00, CURRENT_DATE - 20, CURRENT_DATE - 20, 'paid', 'pix', v_user_id),
    (uuid_generate_v4(), v_est_id, 'income', 'Vendas', 'Receita vendas semana 2 Out', 1450.00, CURRENT_DATE - 13, CURRENT_DATE - 13, 'paid', 'pix', v_user_id),
    (uuid_generate_v4(), v_est_id, 'income', 'Vendas', 'Receita vendas semana 3 Out', 1380.00, CURRENT_DATE - 6, CURRENT_DATE - 6, 'paid', 'pix', v_user_id),
    (uuid_generate_v4(), v_est_id, 'income', 'Serviços', 'Receita serviços semana 1 Out', 620.00, CURRENT_DATE - 20, CURRENT_DATE - 20, 'paid', NULL, v_user_id),
    (uuid_generate_v4(), v_est_id, 'income', 'Serviços', 'Receita serviços semana 2 Out', 740.00, CURRENT_DATE - 13, CURRENT_DATE - 13, 'paid', NULL, v_user_id),
    (uuid_generate_v4(), v_est_id, 'income', 'Serviços', 'Receita serviços semana 3 Out', 580.00, CURRENT_DATE - 6, CURRENT_DATE - 6, 'paid', NULL, v_user_id);

  -- =============================================================
  -- LICENÇA
  -- =============================================================
  INSERT INTO licenses (id, establishment_id, plan, status, starts_at, expires_at, features) VALUES
    (uuid_generate_v4(), v_est_id, 'basic', 'active', now() - interval '30 days', now() + interval '335 days', '{"max_users": 5, "max_products": 500, "reports": true}');

  RAISE NOTICE 'Seed data inserido com sucesso para establishment %', v_est_id;

END $$;
