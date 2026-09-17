-- ============================================================
-- RLS — permissoes_template_perfil
-- ============================================================
-- Faltava desde o schema inicial: sem RLS, qualquer usuário
-- autenticado (não só admin) conseguia conceder/revogar template
-- pra QUALQUER perfil via API direta — a curadoria "só o admin
-- decide quais temas cada perfil pode usar" só existia na UI, não
-- no banco. Agora fica de fato restrita a admin da organização.
-- ============================================================

alter table permissoes_template_perfil enable row level security;

create policy permissoes_template_perfil_select_proprio_ou_admin
    on permissoes_template_perfil
    for select
    using (
        exists (
            select 1 from perfis p
            where p.id = permissoes_template_perfil.perfil_id
              and (
                p.usuario_id = auth.uid()
                or e_admin_da_organizacao(p.organizacao_id)
              )
        )
    );

create policy permissoes_template_perfil_insert_admin
    on permissoes_template_perfil
    for insert
    with check (
        exists (
            select 1 from perfis p
            where p.id = permissoes_template_perfil.perfil_id
              and e_admin_da_organizacao(p.organizacao_id)
        )
    );

create policy permissoes_template_perfil_delete_admin
    on permissoes_template_perfil
    for delete
    using (
        exists (
            select 1 from perfis p
            where p.id = permissoes_template_perfil.perfil_id
              and e_admin_da_organizacao(p.organizacao_id)
        )
    );
