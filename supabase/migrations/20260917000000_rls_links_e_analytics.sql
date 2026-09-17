-- ============================================================
-- RLS — links, sessoes, visualizacoes_pagina, cliques_link
-- ============================================================
-- Replica em 'links' o mesmo padrão de 'perfis' (dono do perfil
-- ou admin da organização enxerga/edita; visitante público só
-- enxerga o que está ativo).
--
-- Para as tabelas de analytics (sessoes, visualizacoes_pagina,
-- cliques_link) o padrão muda de forma: são eventos, não
-- registros editáveis.
--   - SELECT: só dono do perfil ou admin da organização (são os
--     dados que alimentam o dashboard).
--   - INSERT: liberado para qualquer visitante (inclusive anon),
--     mas restrito a perfis/links ativos — é assim que a página
--     pública registra clique/pageview sem precisar de login.
--   - Sem UPDATE/DELETE: são eventos imutáveis.
-- ============================================================

-- ------------------------------------------------------------
-- LINKS
-- ------------------------------------------------------------
alter table links enable row level security;

create policy links_select_proprio_ou_admin on links
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or exists (
                    select 1 from usuarios u
                    where u.id = auth.uid()
                      and u.papel = 'admin'
                      and u.organizacao_id = p.organizacao_id
                )
              )
        )
    );

create policy links_insert_proprio_ou_admin on links
    for insert
    with check (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or exists (
                    select 1 from usuarios u
                    where u.id = auth.uid()
                      and u.papel = 'admin'
                      and u.organizacao_id = p.organizacao_id
                )
              )
        )
    );

create policy links_update_proprio_ou_admin on links
    for update
    using (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or exists (
                    select 1 from usuarios u
                    where u.id = auth.uid()
                      and u.papel = 'admin'
                      and u.organizacao_id = p.organizacao_id
                )
              )
        )
    );

create policy links_delete_proprio_ou_admin on links
    for delete
    using (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or exists (
                    select 1 from usuarios u
                    where u.id = auth.uid()
                      and u.papel = 'admin'
                      and u.organizacao_id = p.organizacao_id
                )
              )
        )
    );

-- Página pública: só links ativos de perfis ativos.
create policy links_leitura_publica on links
    for select
    using (
        esta_ativo = true
        and exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and p.esta_ativo = true
        )
    );

-- ------------------------------------------------------------
-- SESSOES
-- ------------------------------------------------------------
alter table sessoes enable row level security;

create policy sessoes_select_proprio_ou_admin on sessoes
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = sessoes.perfil_id
              and (
                p.usuario_id = auth.uid()
                or exists (
                    select 1 from usuarios u
                    where u.id = auth.uid()
                      and u.papel = 'admin'
                      and u.organizacao_id = p.organizacao_id
                )
              )
        )
    );

create policy sessoes_insert_publico on sessoes
    for insert
    with check (
        exists (
            select 1 from perfis p
            where p.id = sessoes.perfil_id
              and p.esta_ativo = true
        )
    );

-- ------------------------------------------------------------
-- VISUALIZACOES_PAGINA
-- ------------------------------------------------------------
alter table visualizacoes_pagina enable row level security;

create policy visualizacoes_pagina_select_proprio_ou_admin on visualizacoes_pagina
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = visualizacoes_pagina.perfil_id
              and (
                p.usuario_id = auth.uid()
                or exists (
                    select 1 from usuarios u
                    where u.id = auth.uid()
                      and u.papel = 'admin'
                      and u.organizacao_id = p.organizacao_id
                )
              )
        )
    );

create policy visualizacoes_pagina_insert_publico on visualizacoes_pagina
    for insert
    with check (
        exists (
            select 1 from perfis p
            where p.id = visualizacoes_pagina.perfil_id
              and p.esta_ativo = true
        )
    );

-- ------------------------------------------------------------
-- CLIQUES_LINK
-- ------------------------------------------------------------
alter table cliques_link enable row level security;

create policy cliques_link_select_proprio_ou_admin on cliques_link
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = cliques_link.perfil_id
              and (
                p.usuario_id = auth.uid()
                or exists (
                    select 1 from usuarios u
                    where u.id = auth.uid()
                      and u.papel = 'admin'
                      and u.organizacao_id = p.organizacao_id
                )
              )
        )
    );

-- Insert público só se o link E o perfil apontados baterem entre
-- si e estiverem ativos — evita clique fantasma registrado contra
-- um link já desativado ou de outro perfil (inflar métricas).
create policy cliques_link_insert_publico on cliques_link
    for insert
    with check (
        exists (
            select 1 from links l
            join perfis p on p.id = l.perfil_id
            where l.id = cliques_link.link_id
              and l.perfil_id = cliques_link.perfil_id
              and l.esta_ativo = true
              and p.esta_ativo = true
        )
    );
