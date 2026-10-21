# 🐾 PetGestão

**Sistema completo de gestão para pet shops e clínicas veterinárias** com arquitetura multi-estabelecimento, controle de permissões granular e módulos integrados de ponta a ponta.

🔗 **Demo:** [petgestao-app.vercel.app](https://petgestao-app.vercel.app)

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Estilização | Tailwind CSS 4 |
| UI Components | Radix UI, Lucide Icons |
| Roteamento | React Router v7 |
| Backend / DB | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Segurança | Row Level Security (RLS) |
| Deploy | Vercel |

## Módulos

- **Dashboard** — Indicadores em tempo real (vendas do dia, agendamentos, ticket médio, estoque baixo)
- **Cadastros** — Clientes, Pets, Produtos, Categorias, Serviços, Profissionais, Fornecedores
- **PDV (Ponto de Venda)** — Vendas com múltiplas formas de pagamento
- **Agendamento** — Banho, tosa e consultas com status e filtros por data
- **Ordens de Serviço** — Workflow completo com checkin/checkout e itens
- **Estoque** — Controle com alertas de reposição
- **Financeiro** — Contas a pagar e a receber com status
- **Compras** — Pedidos a fornecedores com recebimento parcial
- **Caixa** — Abertura e fechamento diário
- **Relatórios** — 5 tipos (vendas, financeiro, estoque, serviços, clientes) com filtros por período
- **Usuários** — Gerenciamento de membros com 6 cargos e 47 permissões
- **Configurações** — Dados do estabelecimento e perfil do usuário
- **Onboarding** — Fluxo de primeiro acesso com criação atômica de estabelecimento
- **Licença** — Gerenciamento de planos e funcionalidades

## Arquitetura

```
src/
  components/       # Componentes reutilizáveis (UI, Layout)
  contexts/         # AuthContext (auth + multi-estabelecimento)
  lib/              # Configuração do Supabase client
  pages/            # Módulos organizados por domínio
  types/            # Tipagens TypeScript
supabase/
  migrations/       # Migrations SQL versionadas
```

### Segurança

- **Row Level Security (RLS)** em todas as tabelas
- Função `get_user_establishment_ids()` (SECURITY DEFINER) para isolamento de dados
- Função `create_establishment_with_owner()` para onboarding atômico
- Autenticação completa via Supabase Auth (login, registro, recuperação de senha)
- Permissões granulares por cargo (proprietário, gerente, atendente, banhista, estoquista, financeiro)

## Como rodar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# Executar migrations no Supabase SQL Editor
# 001_foundation.sql → 002_sales_cash_schedule.sql → 003_onboarding_and_purchases.sql

# Iniciar em desenvolvimento
npm run dev
```

## Build & Deploy

```bash
# Build de produção
npm run build

# Deploy no Vercel
vercel deploy --prod
```

## Licença

Projeto privado — todos os direitos reservados.
