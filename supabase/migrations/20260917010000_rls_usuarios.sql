-- ============================================================
-- RLS — usuarios
-- ============================================================
-- Faltava no schema inicial: sem RLS habilitada, qualquer usuário
-- autenticado conseguia ler a tabela usuarios inteira via API
-- (e-mail, papel, status de todo mundo) assim que o frontend
-- começou a consultar essa tabela pelo client autenticado.
--
-- Só SELECT é liberado por policy (o próprio registro, ou todos
-- os da organização se for admin). INSERT/UPDATE de usuarios
-- (convite, ativação, mudança de papel) passam pelo service role
-- nas server actions — nunca pelo client anon/authenticated —
-- então não há policy de insert/update aqui de propósito: por
-- padrão, sem policy, essas operações ficam bloqueadas pra
-- anon/authenticated.
-- ============================================================

alter table usuarios enable row level security;

create policy usuarios_select_proprio_ou_admin on usuarios
    for select
    using (
        id = auth.uid()
        or exists (
            select 1 from usuarios admin
            where admin.id = auth.uid()
              and admin.papel = 'admin'
              and admin.organizacao_id = usuarios.organizacao_id
        )
    );
