# 💰 Financial Control All - Agent Guide

Sistema profissional de gestão financeira pessoal e empresarial.

---

## 🧠 Princípios de Arquitetura

- Server-first: priorizar Server Components e Server Actions
- Client mínimo necessário (evitar hidratação excessiva)
- Separação clara entre UI, lógica e acesso a dados
- Single source of truth: Prisma Schema é a fonte de verdade
- Multi-tenant by design: toda entidade deve respeitar `workspaceId`
- Segurança por padrão (secure by default)
- Tipagem forte em toda a aplicação (end-to-end typesafe)

---

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
| Data Fetching  | SWR                                  |
| Tabelas        | @tanstack/react-table                |
| Animações      | Framer Motion                        |
| Gráficos       | Recharts                             |

---

## 📁 Estrutura do Projeto

```
financial-control-all/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── components/
├── hooks/                # Hooks SWR (client)
├── lib/
│   ├── queries/          # Acesso a dados (server/client)
│   ├── services/         # Regras de negócio
│   └── prisma.ts
├── prisma/
└── AGENTS.md
```

---

## 🧱 Camadas da Aplicação

### 1. Queries (Data Access)

- Apenas acesso ao banco via Prisma
- Nenhuma regra de negócio
- Server e client separados

### 2. Services (Business Logic)

- Regras de negócio
- Validações complexas
- Orquestra queries

### 3. Hooks (Client)

- Consumo via SWR
- Nunca acessar API direto no componente

### 4. UI (Components)

- Apenas renderização
- Sem lógica de dados

---

## ⚡ Server Actions vs API Routes

### Server Actions (Padrão)

Usar para:

- Create / Update / Delete
- Ações de formulários
- Operações internas

### API Routes

Usar apenas quando:

- Webhooks
- Integrações externas
- Endpoints públicos

❗ Nunca duplicar lógica entre ambos

---

## 🔄 Requisições e Data Fetching (PADRÃO OFICIAL)

### ❌ PROIBIDO

- Fetch direto dentro de componentes
- Axios/fetch dentro de `useEffect`
- Lógica de API dentro da UI

---

### ✅ PADRÃO CORRETO

#### 1. Criar Query (server/client)

```ts
// lib/queries/transactions-client.ts
export async function getTransactions() {
  const res = await fetch('/api/transactions');
  return res.json();
}
```

---

#### 2. Criar Hook com SWR

```ts
// hooks/useTransactions.ts
import useSWR from 'swr';
import { getTransactions } from '@/lib/queries/transactions-client';

export function useTransactions() {
  return useSWR('transactions', getTransactions);
}
```

---

#### 3. Usar no componente

```tsx
const { data, isLoading } = useTransactions();
```

---

## 🚨 REGRA CRÍTICA

- Componentes **NUNCA** fazem requisições
- Componentes **SEMPRE** usam hooks
- Hooks **SEMPRE** usam queries ou Server Actions

---

## 🧠 Gerenciamento de Estado

- Zustand apenas para estado global (UI)
- NÃO usar para dados do backend
- Dados remotos → SWR ou Server Components
- Evitar duplicação de estado

---

## 🧬 Tipagem

- Prisma é a fonte de verdade
- Nunca duplicar tipos manualmente
- Usar `z.infer<>` para schemas
- Tipagem end-to-end obrigatória

---

## 🛠️ Validação e Formulários

- Sempre usar React Hook Form + Zod
- Schema único por formulário
- Validar no client e server
- Feedback visual obrigatório
- Sanitização contra XSS
- Evitar useState/useEffect para forms

---

## 🔐 Segurança

- Validar tudo com Zod (server-side)
- Nunca confiar no client
- Verificar `workspaceId` sempre
- Controle por roles (ADMIN, MANAGER, VIEWER)
  - Só pode criar/alterar/deletar se for ADMIN, MANAGER
  - Só pode visualizar se for ADMIN, MANAGER ou VIEWER
- Logs de auditoria obrigatórios
- Não expor dados sensíveis

---

## ⚡ Performance

- Priorizar Server Components
- Paginação obrigatória
- Cache com `revalidate` e SWR
- Lazy loading quando necessário
- Evitar re-renderizações

---

## 🧪 Testes

- Unitários para services
- Integração para queries
- UI para fluxos críticos

Ferramentas:

- Vitest / Jest
- Testing Library

---

## 🎨 UI/UX

- Shadcn/UI como base
- Responsivo
- Dark mode obrigatório
- Loading states sempre presentes
- Micro-animações com Framer Motion
- Skeleton Loading obrigatorio
- Empty State obrigatório em tabelas e cards

---

## 🔄 Fluxo Padrão de CRUD

1. Schema (Zod)
2. Form (React Hook Form)
3. Server Action / Service
4. Query (Prisma)
5. Hook (SWR)
6. UI (feedback)

❗ Nunca pular etapas

---

## 🔐 Autenticação e Autorização

- NextAuth obrigatório
- Proteção via middleware/session
- Multi-tenant com `workspaceId`
- Controle por roles

---

## 📊 Observabilidade

- Logs estruturados
- Tratamento centralizado de erros
- Auditoria em ações críticas
- Tratamento de erro em todas as ações

---

## 📋 Convenções de Código

- PascalCase → Componentes
- camelCase → variáveis/funções
- SCREAMING_SNAKE_CASE → constantes
- `-client.ts` → client queries

---

## 📦 Scripts

| Comando         | Descrição       |
| :-------------- | :-------------- |
| npm run dev     | Desenvolvimento |
| npm run build   | Build           |
| npm run start   | Produção        |
| npm run lint    | Lint            |
| docker:dev      | Docker up       |
| docker:dev:down | Docker down     |

---

## 🤖 Diretrizes para Agentes (IA)

- Sempre seguir este documento
- Nunca criar lógica fora das camadas
- Nunca fazer fetch em componente
- Sempre criar hooks para consumo de dados
- Sempre usar SWR no client
- Sempre usar Server Actions ou Queries
- Nunca duplicar código
- Sempre reutilizar componentes
- Sempre validar com Zod
- Sempre respeitar multi-tenant (`workspaceId`)
- Sempre manter tipagem forte

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

---

## ✅ Checklist antes de implementar

- Existe algo parecido já implementado?
- Posso reutilizar algum componente/hook?
- Estou respeitando as camadas?
- Estou usando tipagem correta?
- Estou usando Zod?
- Estou evitando lógica no componente?

---

Este documento é a fonte de verdade para desenvolvimento e uso de IA no projeto.
Qualquer código fora desses padrões deve ser considerado incorreto.
