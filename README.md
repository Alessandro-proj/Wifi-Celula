# WiFi Celula

Sistema web para controle de presenca da celula WiFi: "Conectados com Deus e uns com os outros".

## Tecnologias

- Next.js App Router, React e TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, RLS e Storage
- React Hook Form e Zod
- Recharts, date-fns e Lucide Icons
- Preparado para GitHub, Vercel e Supabase

## 1. Instalar dependencias

```bash
npm install
```

## 2. Criar o projeto no Supabase

1. Crie um projeto no Supabase.
2. Em `Project Settings > API`, copie a URL e a anon key.
3. Em `Project Settings > API`, copie a service role key apenas para uso no servidor.
4. Em `Authentication > URL Configuration`, configure a Site URL como `http://localhost:3000`.

## 3. Executar o SQL

No SQL Editor do Supabase, execute nesta ordem:

```sql
-- 1
-- cole o conteudo de supabase/schema.sql

-- 2
-- cole o conteudo de supabase/seed.sql
```

O arquivo `supabase/schema.sql` cria enums, tabelas, relacionamentos, indices, triggers de `updated_at`, auditoria, buckets de Storage e politicas RLS. O arquivo `supabase/seed.sql` cria a celula WiFi, 3 grupos e 30 pessoas cadastradas. Encontros, presencas, notificacoes e anotacoes comecam zerados.

## 4. Configurar variaveis de ambiente

Crie `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Nunca use `SUPABASE_SERVICE_ROLE_KEY` no frontend. Ela e lida somente por rotas server-side.

## 5. Criar o primeiro administrador

Como ainda nao existe admin para criar usuarios pelo app, faca o bootstrap uma vez:

1. Crie um usuario em `Authentication > Users`.
2. Copie o UUID desse usuario.
3. Execute:

```sql
insert into public.profiles (id, full_name, email, role, active)
values ('UUID_DO_AUTH_USER', 'Administrador WiFi', 'admin@seudominio.com', 'admin', true);

insert into public.cell_users (cell_id, user_id, role_in_cell)
values ('00000000-0000-4000-8000-000000000001', 'UUID_DO_AUTH_USER', 'admin');
```

Depois disso, a tela `/admin/usuarios` pode criar lideres, auxiliares e visualizadores usando a rota segura `/api/admin/users`.

## 6. Executar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`. Sem variaveis do Supabase, o app abre em modo de desenvolvimento com dados ficticios. Com Supabase configurado, as consultas usam dados reais e RLS.

## 7. Publicar na Vercel

1. Envie o projeto para o GitHub.
2. Importe o repositorio na Vercel.
3. Configure as mesmas variaveis de ambiente.
4. Atualize `NEXT_PUBLIC_APP_URL` com a URL de producao.
5. No Supabase Auth, atualize a Site URL para a URL de producao.
6. Publique.

## 8. Conectar ao GitHub

```bash
git init
git add .
git commit -m "Initial WiFi Celula system"
git branch -M main
git remote add origin https://github.com/Alessandro-proj/Wifi-Celula.git
git push -u origin main
```

## 9. Alterar nome, cores e logotipo

- Nome e metadados: `src/app/layout.tsx`
- Cores globais: `src/app/globals.css`
- Logo textual e icone: `src/components/workspace/ui.tsx` em `BrandMark`
- Textos da tela de login: `src/components/auth/auth-card.tsx`

## 10. Criar novas celulas

Administradores podem criar novos registros na tabela `cells` e vincular usuarios em `cell_users`. O app e o RLS ja filtram dados por celula vinculada ao usuario.

## 11. Backup da base

Use uma das opcoes:

- Supabase Dashboard: `Project Settings > Database > Backups`
- Supabase CLI: `supabase db dump`
- Exportacao pontual: relatórios em CSV e impressao/PDF pela tela `/relatorios`

## Permissoes

- `admin`: acessa todas as celulas, usuarios, auditoria, relatorios e configuracoes.
- `leader`: acessa a celula vinculada, gerencia integrantes e encontros, registra e corrige presencas.
- `assistant`: acessa a celula vinculada, registra presenca e visitantes, sem exclusoes sensiveis.
- `viewer`: apenas visualizacao.

As permissoes existem na interface e nas politicas RLS. O frontend nunca deve ser a unica camada de seguranca.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```
