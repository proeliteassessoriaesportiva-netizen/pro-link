-- Dados de exemplo para desenvolvimento local.
-- Roda automaticamente após as migrations em `supabase db reset`.

insert into organizacoes (nome, slug, dominio_principal) values
    ('Pro Elite', 'pro-elite', 'proelite.com.br');

insert into temas (nome, slug, configuracao) values
    ('PRO', 'pro', '{
        "corFundo": "#0a0a0a",
        "corTexto": "#ededed",
        "corBotaoFundo": "#ffffff",
        "corBotaoTexto": "#000000",
        "corBotaoBorda": "rgba(255,255,255,0.2)",
        "fonte": "sans"
    }'::jsonb),
    ('CLEAN', 'clean', '{
        "corFundo": "#ffffff",
        "corTexto": "#111111",
        "corBotaoFundo": "#ffffff",
        "corBotaoTexto": "#111111",
        "corBotaoBorda": "#111111",
        "fonte": "sans"
    }'::jsonb),
    ('DARK', 'dark', '{
        "corFundo": "#05010d",
        "corTexto": "#e5e0ff",
        "corBotaoFundo": "#7c3aed",
        "corBotaoTexto": "#ffffff",
        "corBotaoBorda": "#7c3aed",
        "fonte": "mono"
    }'::jsonb);
