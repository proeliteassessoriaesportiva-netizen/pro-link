# Pro Link

Plataforma de "link na bio" (estilo Linktree) para a Pro Elite Assessoria Esportiva, com suporte multi-organização desde o schema.

## Stack do banco

- PostgreSQL via [Supabase](https://supabase.com)
- Migrations versionadas em [`supabase/migrations`](supabase/migrations)

## Estrutura

```
supabase/
  config.toml           # configuração do projeto Supabase local
  migrations/
    20260916000000_initial_schema.sql       # schema inicial (organizações, usuários, perfis, links, analytics, RLS em perfis)
    20260917000000_rls_links_e_analytics.sql # RLS em links, sessoes, visualizacoes_pagina, cliques_link
  seed.sql               # dados de exemplo para desenvolvimento local
types/
  database.ts             # tipos TypeScript gerados a partir do schema (não editar à mão)
```

## Pré-requisitos

- [Docker](https://www.docker.com/) (para o Supabase local)
- Supabase CLI — instalada como dev dependency deste projeto (`npm install`), rode com `npx supabase <comando>`

## Rodando localmente

```bash
npx supabase start      # sobe Postgres, Studio, Auth etc. localmente via Docker
npx supabase db reset    # aplica as migrations + seed.sql do zero
```

O Supabase Studio fica disponível em `http://localhost:54323`.

## Deploy do schema num projeto Supabase remoto

O projeto já está linkado ao Supabase remoto (`bcbuzthxrqwdimaihaoi`). Pra aplicar novas migrations:

```bash
npx supabase db push
```

Pra linkar em outra máquina:

```bash
npx supabase login
npx supabase link --project-ref bcbuzthxrqwdimaihaoi
```

## Decisões de design do schema

Ver os comentários no topo de [`20260916000000_initial_schema.sql`](supabase/migrations/20260916000000_initial_schema.sql) — cobrem multi-organização, fluxo de convite de usuários, slugs reservados, permissões de template por perfil, proteção contra redirecionador aberto (phishing) e anonimização de dados de analytics (LGPD).

Row Level Security está habilitada em todas as tabelas de dado de perfil/analytics (`perfis`, `links`, `sessoes`, `visualizacoes_pagina`, `cliques_link`): dono do perfil ou admin da organização enxerga/edita; visitante público só enxerga perfis/links ativos e só pode inserir eventos de analytics contra perfis/links ativos. Ver [`20260917000000_rls_links_e_analytics.sql`](supabase/migrations/20260917000000_rls_links_e_analytics.sql).

## Tipos TypeScript

Os tipos em [`types/database.ts`](types/database.ts) são gerados a partir do schema do banco remoto e não devem ser editados à mão. Depois de qualquer migration nova:

```bash
npm run gen:types
```
