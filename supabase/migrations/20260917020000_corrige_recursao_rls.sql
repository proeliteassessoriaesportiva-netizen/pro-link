-- ============================================================
-- Corrige recursão infinita nas policies de "admin da organização"
-- ============================================================
-- Toda policy de "dono ou admin" checava admin com um subquery
-- direto em usuarios: exists (select 1 from usuarios u where
-- u.id = auth.uid() and u.papel = 'admin' ...). Como usuarios
-- também tem RLS, avaliar ESSA policy reexecuta a mesma checagem,
-- que reexecuta de novo, e assim por diante — Postgres aborta com
-- "infinite recursion detected in policy for relation usuarios".
--
-- Isso quebrava login em qualquer tabela cuja policy checasse
-- admin (usuarios, perfis, links, sessoes, visualizacoes_pagina,
-- cliques_link) — não só usuarios.
--
-- Fix padrão do Postgres/Supabase pra esse caso: mover a checagem
-- pra uma função security definer. Ela roda com o dono da função
-- (postgres, dono das tabelas), que não está sujeito a RLS — então
-- a consulta interna em usuarios não reaciona a própria policy.
-- ============================================================

create or replace function e_admin_da_organizacao(id_organizacao uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios
    where usuarios.id = auth.uid()
      and usuarios.papel = 'admin'
      and usuarios.organizacao_id = id_organizacao
  );
$$;

-- usuarios ---------------------------------------------------
drop policy if exists usuarios_select_proprio_ou_admin on usuarios;
create policy usuarios_select_proprio_ou_admin on usuarios
    for select
    using (
        id = auth.uid()
        or e_admin_da_organizacao(usuarios.organizacao_id)
    );

-- perfis -------------------------------------------------------
drop policy if exists perfis_select_proprio_ou_admin on perfis;
create policy perfis_select_proprio_ou_admin on perfis
    for select
    using (
        usuario_id = auth.uid()
        or e_admin_da_organizacao(perfis.organizacao_id)
    );

drop policy if exists perfis_update_proprio_ou_admin on perfis;
create policy perfis_update_proprio_ou_admin on perfis
    for update
    using (
        usuario_id = auth.uid()
        or e_admin_da_organizacao(perfis.organizacao_id)
    );

-- links ----------------------------------------------------------
drop policy if exists links_select_proprio_ou_admin on links;
create policy links_select_proprio_ou_admin on links
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );

drop policy if exists links_insert_proprio_ou_admin on links;
create policy links_insert_proprio_ou_admin on links
    for insert
    with check (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );

drop policy if exists links_update_proprio_ou_admin on links;
create policy links_update_proprio_ou_admin on links
    for update
    using (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );

drop policy if exists links_delete_proprio_ou_admin on links;
create policy links_delete_proprio_ou_admin on links
    for delete
    using (
        exists (
            select 1 from perfis p
            where p.id = links.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );

-- sessoes ----------------------------------------------------------
drop policy if exists sessoes_select_proprio_ou_admin on sessoes;
create policy sessoes_select_proprio_ou_admin on sessoes
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = sessoes.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );

-- visualizacoes_pagina ------------------------------------------------
drop policy if exists visualizacoes_pagina_select_proprio_ou_admin on visualizacoes_pagina;
create policy visualizacoes_pagina_select_proprio_ou_admin on visualizacoes_pagina
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = visualizacoes_pagina.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );

-- cliques_link -------------------------------------------------------
drop policy if exists cliques_link_select_proprio_ou_admin on cliques_link;
create policy cliques_link_select_proprio_ou_admin on cliques_link
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = cliques_link.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );
