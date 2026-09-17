-- ============================================================
-- PRO LINK — Schema do banco de dados (PostgreSQL / Supabase)
-- Versão: 1.0 (MVP)
-- ============================================================
-- Decisões de design que resolvem os gaps da revisão do PRD:
--
-- 1. organizacao_id em todo lugar → prepara pra virar SaaS
--    multi-organização sem migração dolorosa depois.
-- 2. usuarios.status controla o fluxo de convite/aprovação.
-- 3. slugs_reservados impede colisão com rotas do sistema.
-- 4. permissoes_template_perfil dá controle granular de
--    quais templates cada perfil pode usar.
-- 5. cliques_link e visualizacoes_pagina usam hash_visitante
--    (SHA-256 de IP+UserAgent+salt diário, não o dado bruto) —
--    reduz exposição de dado pessoal (LGPD) mantendo estimativa
--    de visitante único.
-- 6. links.dominio_destino + dominios_redirecionamento_permitidos
--    fecham o redirecionador aberto (risco de phishing
--    usando o domínio da marca).
-- 7. Índices pensados pros dois acessos mais quentes:
--    dashboard por perfil (analytics) e resolução de slug
--    pela página pública.
-- ============================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "citext";   -- comparação case-insensitive de slugs

-- ------------------------------------------------------------
-- 1. ORGANIZAÇÕES
-- ------------------------------------------------------------
-- Hoje só existe a Pro Elite, mas o PRD (seção 19) já prevê
-- virar SaaS pra outras assessorias. Criar a tabela agora custa
-- quase nada; adicionar depois com dados em produção é caro.
create table organizacoes (
    id              uuid primary key default gen_random_uuid(),
    nome            text not null,
    slug            text not null unique,       -- ex: 'pro-elite'
    dominio_principal text not null,             -- ex: 'proelite.com.br'
    criado_em       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. SLUGS RESERVADOS
-- ------------------------------------------------------------
-- Impede que um usuário registre um slug que colide com rota
-- do sistema (ex: /admin, /login, /api, /go, /dashboard).
create table slugs_reservados (
    slug        text primary key,
    motivo      text
);

insert into slugs_reservados (slug, motivo) values
    ('admin', 'rota do sistema'),
    ('api', 'rota do sistema'),
    ('login', 'rota do sistema'),
    ('logout', 'rota do sistema'),
    ('dashboard', 'rota do sistema'),
    ('go', 'namespace de redirecionamento'),
    ('assets', 'arquivos estáticos'),
    ('settings', 'rota do sistema');

-- ------------------------------------------------------------
-- 3. USUÁRIOS
-- ------------------------------------------------------------
-- status controla o fluxo de convite/aprovação que faltava no
-- PRD original. Fluxo sugerido: admin convida (status='convidado')
-- → usuário aceita e define senha (status='ativo') → admin
-- pode suspender (status='suspenso').
create type papel_usuario as enum ('admin', 'membro');
create type status_usuario as enum ('convidado', 'ativo', 'suspenso');

create table usuarios (
    id                  uuid primary key default gen_random_uuid(),
    organizacao_id      uuid not null references organizacoes(id) on delete cascade,
    email               text not null,
    papel               papel_usuario not null default 'membro',
    status              status_usuario not null default 'convidado',
    convidado_por       uuid references usuarios(id),
    convidado_em        timestamptz not null default now(),
    ativado_em          timestamptz,
    criado_em           timestamptz not null default now(),

    unique (organizacao_id, email)
);

-- ------------------------------------------------------------
-- 4. TEMAS (templates)
-- ------------------------------------------------------------
create table temas (
    id              uuid primary key default gen_random_uuid(),
    nome            text not null,            -- 'PRO', 'CLEAN', 'DARK'
    slug            text not null unique,
    configuracao    jsonb not null default '{}'::jsonb,  -- cores, fontes etc.
    esta_ativo      boolean not null default true
);

-- ------------------------------------------------------------
-- 5. PERFIS
-- ------------------------------------------------------------
create table perfis (
    id                  uuid primary key default gen_random_uuid(),
    organizacao_id      uuid not null references organizacoes(id) on delete cascade,
    usuario_id          uuid not null unique references usuarios(id) on delete cascade,

    slug                citext not null,       -- citext = case-insensitive
    nome_exibicao       text not null,
    cargo               text,                  -- ex: Treinador de corrida
    biografia           text,
    url_avatar          text,

    url_instagram       text,
    url_youtube         text,
    url_whatsapp        text,

    tema_id             uuid references temas(id),
    esta_ativo          boolean not null default true,

    -- SEO (seção 16 do PRD)
    seo_titulo          text,
    seo_descricao       text,
    url_imagem_og       text,

    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now(),

    unique (organizacao_id, slug),
    constraint slug_nao_reservado check (slug !~ '^(admin|api|login|logout|dashboard|go|assets|settings)$')
);

create index idx_perfis_organizacao_slug on perfis (organizacao_id, slug);

-- ------------------------------------------------------------
-- 6. PERMISSOES_TEMPLATE_PERFIL
-- ------------------------------------------------------------
-- Resolve o gap: "usuário pode selecionar o template permitido
-- pelo administrador" não tinha modelagem. Isso permite ao
-- admin liberar 1, 2 ou N templates por perfil.
create table permissoes_template_perfil (
    perfil_id       uuid not null references perfis(id) on delete cascade,
    tema_id         uuid not null references temas(id) on delete cascade,
    concedido_por   uuid references usuarios(id),
    concedido_em    timestamptz not null default now(),

    primary key (perfil_id, tema_id)
);

-- ------------------------------------------------------------
-- 7. DOMINIOS_REDIRECIONAMENTO_PERMITIDOS
-- ------------------------------------------------------------
-- Fecha o buraco de segurança do redirecionador aberto (seção 9
-- do PRD). Toda URL de destino de um link precisa bater com um
-- domínio nesta lista (por organização) OU passar por aprovação
-- manual (esta_aprovado). Sem isso, /go/xxx vira vetor de phishing
-- usando a confiança no domínio da Pro Elite.
create table dominios_redirecionamento_permitidos (
    id                      uuid primary key default gen_random_uuid(),
    organizacao_id          uuid not null references organizacoes(id) on delete cascade,
    dominio                 text not null,          -- ex: 'instagram.com', 'wa.me'
    permite_subdominio_curinga boolean not null default true, -- permite *.dominio
    criado_em               timestamptz not null default now(),

    unique (organizacao_id, dominio)
);

-- ------------------------------------------------------------
-- 8. LINKS
-- ------------------------------------------------------------
create table links (
    id                  uuid primary key default gen_random_uuid(),
    perfil_id           uuid not null references perfis(id) on delete cascade,

    titulo              text not null,
    url_destino         text not null,
    dominio_destino     text not null,          -- extraído no insert/update, indexado p/ validação
    descricao           text,
    icone               text,
    url_imagem          text,

    posicao             integer not null default 0,
    esta_ativo          boolean not null default true,

    -- true somente se dominio_destino bate com dominios_redirecionamento_permitidos
    -- OU um admin aprovou manualmente (proteção contra phishing)
    dominio_aprovado    boolean not null default false,

    slug                citext not null,        -- usado em /go/{slug}
    criado_em           timestamptz not null default now(),
    atualizado_em       timestamptz not null default now(),

    unique (perfil_id, slug)
);

create index idx_links_perfil_posicao on links (perfil_id, posicao);

-- ------------------------------------------------------------
-- 9. SESSOES (anônimas)
-- ------------------------------------------------------------
-- hash_visitante = hash(ip + user_agent + salt_do_dia), nunca o
-- IP bruto. Suficiente pra estimar visitante único e sessão,
-- reduz exposição de dado pessoal identificável (relevante pra
-- LGPD, que o PRD original não mencionava).
create table sessoes (
    id                  uuid primary key default gen_random_uuid(),
    perfil_id           uuid not null references perfis(id) on delete cascade,
    hash_visitante      text not null,
    primeiro_acesso_em  timestamptz not null default now(),
    ultimo_acesso_em    timestamptz not null default now(),
    origem_referencia   text,                   -- 'instagram', 'whatsapp', 'youtube', 'direct'...

    unique (perfil_id, hash_visitante, primeiro_acesso_em)
);

create index idx_sessoes_perfil_tempo on sessoes (perfil_id, primeiro_acesso_em);

-- ------------------------------------------------------------
-- 10. VISUALIZACOES_PAGINA
-- ------------------------------------------------------------
create table visualizacoes_pagina (
    id                  uuid primary key default gen_random_uuid(),
    perfil_id           uuid not null references perfis(id) on delete cascade,
    sessao_id           uuid references sessoes(id) on delete set null,
    ocorrido_em         timestamptz not null default now(),
    origem_referencia   text,
    tipo_dispositivo    text                    -- 'mobile', 'desktop', 'tablet'
);

create index idx_visualizacoes_pagina_perfil_tempo on visualizacoes_pagina (perfil_id, ocorrido_em);

-- ------------------------------------------------------------
-- 11. CLIQUES_LINK
-- ------------------------------------------------------------
-- Rate limiting (mencionado genericamente na seção 17 do PRD)
-- deve ser aplicado na camada de aplicação sobre este insert
-- especificamente — é o endpoint mais óbvio pra inflar métricas
-- de um perfil artificialmente.
create table cliques_link (
    id                  uuid primary key default gen_random_uuid(),
    link_id             uuid not null references links(id) on delete cascade,
    perfil_id           uuid not null references perfis(id) on delete cascade,
    sessao_id           uuid references sessoes(id) on delete set null,
    ocorrido_em         timestamptz not null default now(),
    tipo_dispositivo    text
);

create index idx_cliques_link_link_tempo on cliques_link (link_id, ocorrido_em);
create index idx_cliques_link_perfil_tempo on cliques_link (perfil_id, ocorrido_em);

-- ============================================================
-- ROW LEVEL SECURITY (seção 17 do PRD)
-- ============================================================
-- Regra geral: MEMBRO só enxerga o próprio perfil e dados
-- ligados a ele; ADMIN enxerga tudo dentro da própria
-- organização. Exemplo para 'perfis' — replicar o mesmo
-- padrão em links, sessoes, visualizacoes_pagina, cliques_link.

alter table perfis enable row level security;

create policy perfis_select_proprio_ou_admin on perfis
    for select
    using (
        usuario_id = auth.uid()
        or exists (
            select 1 from usuarios u
            where u.id = auth.uid()
              and u.papel = 'admin'
              and u.organizacao_id = perfis.organizacao_id
        )
    );

create policy perfis_update_proprio_ou_admin on perfis
    for update
    using (
        usuario_id = auth.uid()
        or exists (
            select 1 from usuarios u
            where u.id = auth.uid()
              and u.papel = 'admin'
              and u.organizacao_id = perfis.organizacao_id
        )
    );

-- Página pública (visitante, sem login) precisa de policy própria
-- liberando SELECT apenas de perfis com esta_ativo = true, via
-- uma role/anon key separada — não reutilizar a policy acima.
create policy perfis_leitura_publica on perfis
    for select
    using (esta_ativo = true);
