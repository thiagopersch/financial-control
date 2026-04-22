# 💰 Financial Control All - Agent Guide

Sistema profissional de gestão financeira pessoal e empresarial.

## 🚀 Tecnologias

| Categoria      | Tecnologia                           |
| :------------- | :----------------------------------- |
| Framework      | Next.js 16 (App Router)              |
| Linguagem      | TypeScript                           |
| Banco de Dados | PostgreSQL + Prisma ORM 7            |
| Autenticação   | NextAuth.js                          |
| UI             | Tailwind CSS 4 + Shadcn/UI + Base UI |
| Estado         | Zustand                              |
| Formulários    | React Hook Form + Zod                |
| Tabelas        | @tanstack/react-table                |
| Animações      | Framer Motion                        |
| Gráficos       | Recharts                             |

---

## 📁 Estrutura do Projeto

```
financial-control-all/
├── app/                    # Next.js App Router
│   ├── (auth)/           # Rotas de autenticação
│   ├── (dashboard)/     # Rotas autenticadas
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── cash-flow/
│   │   ├── categories/
│   │   ├── comparisons/
│   │   ├── cost-centers/
│   │   ├── credit-cards/
│   │   ├── debts/
│   │   ├── dre/
│   │   ├── forecast/
│   │   ├── goals/
│   │   ├── insights/
│   │   ├── reports/
│   │   ├── reconciliation/
│   │   ├── scheduled/
│   │   ├── suppliers/
│   │   ├── transactions/
│   │   └── ...
│   └── api/              # API Routes
├── components/
│   ├── ui/              # Componentes Shadcn/UI
│   ├── dashboard/       # Componentes do Dashboard
│   ├── sidebar/         # Navegação
│   └── ...
├── lib/
│   ├── queries/        # Queries Prisma (server)
│   │   ├── accounts.ts
│   │   ├── accounts-client.ts
│   │   ├── budgets.ts
│   │   ├── budgets-client.ts
│   │   ├── categories.ts
│   │   ├── categories-client.ts
│   │   ├── credit-cards.ts
│   │   ├── credit-cards-client.ts
│   │   ├── cost-centers.ts
│   │   ├── cost-centers-client.ts
│   │   ├── debts.ts
│   │   ├── debts-client.ts
│   │   ├── goals.ts
│   │   ├── goals-client.ts
│   │   ├── suppliers.ts
│   │   ├── suppliers-client.ts
│   │   ├── transactions.ts
│   │   ├── transactions-client.ts
│   │   └── ...
│   ├── prisma.ts       # Prisma Client singleton
│   └── ...
├── prisma/
│   ├── schema.prisma  # Schema do banco
│   ├── seed.ts       # Seed do banco
│   └── migrations/  # Migrações
└── AGENTS.md        # Este arquivo
```

---

## 🗄️ Modelos do Banco (Prisma Schema)

### Modelos Principais

- **Workspace** - Área de trabalho (multi-tenant)
- **User** - Usuários com roles (ADMIN, MANAGER, VIEWER)
- **Account** - Contas (carteira, banco, cartão, PIX, investimento)
- **CreditCard** - Cartões de crédito com limite e faturas
- **Invoice** - Faturas mensais de cartões
- **Category** - Categorias de transações (receita/despesa)
- **Transaction** - Transações financeiras
- **Supplier** - Fornecedores/Favorecidos
- **CostCenter** - Centros de custo (hierárquicos)
- **Tag** - Tags para transações
- **Transfer** - Transferências entre contas

### Modelos de Automação

- **RecurringTransaction** - Transações recorrentes
- **ScheduledTransaction** - Transações agendadas
- **CategorizationRule** - Regras de categorize automáticas
- **ConditionalRule** - Regras condicionais

### Modelos de Controle

- **Budget** - Orçamentos mensais por categoria
- **Goal** - Metas financeiras
- **Debt** - Dívidas e empréstimos

### Modelos de Integração Bancária

- **BankAccount** - Contas bancárias vinculadas
- **BankTransaction** - Transações importadas (OFX/CSV)
- **Reconciliation** - Reconciliação automática

### Modelos de Análise

- **SpendingPattern** - Padrões de gastos
- **Anomaly** - Anomalias detectadas
- **CustomReport** - Relatórios customizados
- **AIConversation** - Conversas com AI

### Modelos de Sistema

- **Notification** - Notificações
- **AuditLog** - Logs de auditoria

---

## 🛠️ Scripts Disponíveis

| Comando                   | Descrição                   |
| :------------------------ | :-------------------------- |
| `npm run dev`             | Servidor de desenvolvimento |
| `npm run build`           | Build de produção           |
| `npm run start`           | Servidor de produção        |
| `npm run lint`            | Verificação de código       |
| `npm run docker:dev`      | Subir com Docker            |
| `npm run docker:dev:down` | Parar Docker                |

---

## ⚙️ Como Rodar o Projeto

### 1. Com Docker (Recomendado)

```bash
npm run docker:dev
```

Acesse: http://localhost:3000

### 2. Localmente

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

---

## ✅ Padrões de Código

### Validação e Formulários

- Usar **React Hook Form** + **Zod** para validação
- Validar campos obrigatórios antes do envio
- Exibir feedback visual (erros/sucesso)
- Aplicar máscaras em CPF, telefone, CEP, valores monetários
- Sanitizar inputs contra XSS

### Arquitetura de Dados

- Todas as consultas ao banco via **Prisma Client**
- Tipagens automáticas do Prisma
- Queries separadas em `lib/queries/` (server) e `lib/queries/*-client.ts` (client)
- API Routes em `/app/api/[recurso]/route.ts`

### UI/UX

- Componentes base do **Shadcn/UI**
- Design com gradientes suaves e micro-animações
- **Dark mode** suportado
- Completamente responsivo
- Feedback de loading states

### API Routes

- Retornar `NextResponse.json()` com tipagem Zod
- Tratar erros com `try/catch` e `NextResponse.error()`
- Queries server-only: chamar via `lib/queries/`
- Validação com Zod schema

### Naming Conventions

- PascalCase: arquivos de componentes (`TransactionModal.tsx`)
- camelCase: variáveis e funções
- SCREAMING_SNAKE_CASE: constantes e enums
- Prefixo `-client.ts` para hooks SWR

---

## 🔐 Autenticação e Autorização

- Roles: `ADMIN`, `MANAGER`, `VIEWER`
- Autenticação via NextAuth.js
- Proteger rotas com middleware ou session checks
- workspaceId sempre requerido para queries multi-tenant

---

## 📋 Convenções de Commits

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração
docs: documentação
test: testes
chore: tarefas diversas
```
