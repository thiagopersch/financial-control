# 💰 Sistema de Controle Financeiro

Um sistema profissional de gestão financeira pessoal e empresarial, desenvolvido com foco em performance, experiência do usuário (UX) e segurança.

---

## 🚀 Tecnologias Utilizadas

- **Core**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn/UI](https://ui.shadcn.com/)
- **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/) com [Prisma ORM 7+](https://www.prisma.io/)
- **Autenticação**: [NextAuth.js](https://next-auth.js.org/)
- **Gerenciamento de Estado**: [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- **Formulários**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Tabelas**: [@tanstack/react-table](https://tanstack.com/table/v8)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)

---

## 🛠️ Como Iniciar o Projeto

Existem duas formas principais de rodar o projeto: via Docker (recomendado) ou localmente.

### 1. Pré-requisitos

- **Node.js**: v20 ou superior
- **Docker & Docker Compose** (opcional, mas recomendado)
- **NPM** ou **PNPM**

### 2. Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```bash
cp .env.example .env
```

Certifique-se de configurar as variáveis de banco de dados e o `NEXTAUTH_SECRET`. Para gerar um segredo rápido:

```bash
openssl rand -base64 32
```

---

### 🐳 Opção A: Rodando com Docker (Recomendado)

Esta opção já configura o banco de dados e a aplicação automaticamente.

1. Inicie os containers:

   ```bash
   npm run docker:dev
   ```

2. O sistema estará disponível em: [http://localhost:3000](http://localhost:3000)

---

### 💻 Opção B: Rodando Localmente

Se preferir rodar sem Docker, você precisará de um banco PostgreSQL ativo.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o banco de dados com Prisma:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

3. (Opcional) Popular o banco de dados com dados iniciais:

   ```bash
   npx prisma db seed
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 📜 Scripts Disponíveis

| Comando                   | Descrição                                        |
| :------------------------ | :----------------------------------------------- |
| `npm run dev`             | Inicia o servidor de desenvolvimento local.      |
| `npm run build`           | Cria o build de produção da aplicação.           |
| `npm run start`           | Inicia a aplicação em modo produção.             |
| `npm run lint`            | Executa o linter para verificar erros de código. |
| `npm run docker:dev`      | Sobe o ambiente completo via Docker Compose.     |
| `npm run docker:dev:down` | Para e remove os containers do Docker.           |

---

## 🎨 Padrões de Desenvolvimento

Para manter a consistência do projeto, siga estas diretrizes:

### ✅ Validação e Formulários

- **Validação Antecipada**: Todos os campos obrigatórios devem ser validados antes do envio.
- **Feedback Visual**: Exibir mensagens de erro/sucesso claras e immediatas (loading states).
- **Máscaras**: Aplicar máscaras em campos como CPF, Telefone, CEP e Valores Monetários.
- **Sanitização**: Inputs devem ser sanitizados para evitar XSS e SQL Injection.

### 🧩 UI/UX (Aesthetics)

- **Visual Premium**: Priorize designs modernos com gradientes suaves, micro-animações e dark mode.
- **Responsividade**: O sistema deve ser totalmente funcional em dispositivos móveis.
- **Padrão Shadcn**: Utilize os componentes base do Shadcn/UI customizados para manter a identidade visual.

### 🏗️ Arquitetura de Dados

- **Prisma**: Todas as interações com o banco devem passar pelo Prisma Client.
- **Tipagem**: Utilize as tipagens geradas automaticamente pelo Prisma e interfaces TypeScript rigorosas.
- **Idempotência**: Garanta que requisições de criação/edição sejam seguras contra repetições acidentais.

---

## 📄 Licença

Este projeto é privado e de uso exclusivo.
