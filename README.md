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
    20260916000000_initial_schema.sql   # schema inicial (organizações, usuários, perfis, links, analytics, RLS)
  seed.sql               # dados de exemplo para desenvolvimento local
```

## Pré-requisitos

- [Docker](https://www.docker.com/) (para o Supabase local)
- [Supabase CLI](https://supabase.com/docs/guides/cli) — não está instalada nesta máquina ainda:
  ```bash
  npm install -g supabase
  ```

## Rodando localmente

```bash
supabase start      # sobe Postgres, Studio, Auth etc. localmente via Docker
supabase db reset    # aplica as migrations + seed.sql do zero
```

O Supabase Studio fica disponível em `http://localhost:54323`.

## Deploy do schema num projeto Supabase remoto

```bash
supabase link --project-ref <seu-project-ref>
supabase db push
```

## Decisões de design do schema

Ver os comentários no topo de [`20260916000000_initial_schema.sql`](supabase/migrations/20260916000000_initial_schema.sql) — cobrem multi-organização, fluxo de convite de usuários, slugs reservados, permissões de template por perfil, proteção contra redirecionador aberto (phishing) e anonimização de dados de analytics (LGPD).

**Pendente:** a Row Level Security hoje só está habilitada em `perfis`. O mesmo padrão (membro vê só o próprio perfil, admin vê tudo da organização) precisa ser replicado em `links`, `sessoes`, `visualizacoes_pagina` e `cliques_link` antes de ir para produção.
