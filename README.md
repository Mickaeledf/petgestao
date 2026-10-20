# PetGestao

Sistema completo de gestao para pet shops e clinicas veterinarias com arquitetura multi-estabelecimento, controle de permissoes granular e modulos integrados de ponta a ponta.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Estilizacao | Tailwind CSS 4 |
| UI Components | Radix UI, Lucide Icons |
| Roteamento | React Router v7 |
| Backend / DB | Supabase (PostgreSQL) |
| Autenticacao | Supabase Auth |
| Seguranca | Row Level Security (RLS) |

## Modulos

- **Dashboard** - Indicadores em tempo real (vendas do dia, agendamentos, ticket medio, estoque baixo)
- **Cadastros** - Clientes, Pets, Produtos, Categorias, Servicos, Profissionais, Fornecedores
- **PDV (Ponto de Venda)** - Vendas com multiplas formas de pagamento
- **Agendamento** - Banho, tosa e consultas com status e filtros por data
- **Ordens de Servico** - Workflow completo com checkin/checkout e itens
- **Estoque** - Controle com alertas de reposicao
- **Financeiro** - Contas a pagar e a receber com status
- **Compras** - Pedidos a fornecedores com recebimento parcial
- **Caixa** - Abertura e fechamento diario
- **Relatorios** - 5 tipos (vendas, financeiro, estoque, servicos, clientes) com filtros por periodo
- **Usuarios** - Gerenciamento de membros com 6 cargos e 47 permissoes
- **Configuracoes** - Dados do estabelecimento e perfil do usuario
- **Onboarding** - Fluxo de primeiro acesso com criacao atomica de estabelecimento
- **Licenca** - Gerenciamento de planos e funcionalidades

## Arquitetura

```
src/
  components/       # Componentes reutilizaveis (UI, Layout)
  contexts/         # AuthContext (auth + multi-estabelecimento)
  lib/              # Configuracao do Supabase client
  pages/            # Modulos organizados por dominio
  types/            # Tipagens TypeScript
supabase/
  migrations/       # 3 migrations SQL versionadas
```

### Seguranca

- **Row Level Security (RLS)** em todas as tabelas
- Funcao `get_user_establishment_ids()` (SECURITY DEFINER) para isolamento de dados
- Funcao `create_establishment_with_owner()` para onboarding atomico sem bypass manual
- Autenticacao completa via Supabase Auth (login, registro, recuperacao de senha)
- Permissoes granulares por cargo (proprietario, gerente, atendente, banhista, estoquista, financeiro)

## Como rodar

```bash
# Instalar dependencias
npm install

# Configurar variaveis de ambiente
cp .env.example .env
# Preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Executar migrations no Supabase SQL Editor
# 001_foundation.sql -> 002_sales_cash_schedule.sql -> 003_onboarding_and_purchases.sql

# Iniciar em desenvolvimento
npm run dev
```

## Build

```bash
npm run build
```
