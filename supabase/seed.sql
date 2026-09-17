-- Dados de exemplo para desenvolvimento local.
-- Roda automaticamente após as migrations em `supabase db reset`.

insert into organizacoes (nome, slug, dominio_principal) values
    ('Pro Elite', 'pro-elite', 'proelite.com.br');

insert into temas (nome, slug, configuracao) values
    ('PRO', 'pro', '{}'::jsonb),
    ('CLEAN', 'clean', '{}'::jsonb),
    ('DARK', 'dark', '{}'::jsonb);
