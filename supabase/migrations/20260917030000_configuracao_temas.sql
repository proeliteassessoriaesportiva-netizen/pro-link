-- ============================================================
-- Configuração visual dos temas PRO / CLEAN / DARK
-- ============================================================
-- temas.configuracao ficou como '{}' desde o seed inicial — a
-- página pública sempre usou o mesmo layout fixo, independente do
-- tema escolhido no perfil. Preenche as cores/fonte reais que
-- app/[slug]/page.tsx (via lib/temas.ts) agora aplica dinamicamente.
-- ============================================================

update temas set configuracao = '{
  "corFundo": "#0a0a0a",
  "corTexto": "#ededed",
  "corBotaoFundo": "#ffffff",
  "corBotaoTexto": "#000000",
  "corBotaoBorda": "rgba(255,255,255,0.2)",
  "fonte": "sans"
}'::jsonb
where slug = 'pro';

update temas set configuracao = '{
  "corFundo": "#ffffff",
  "corTexto": "#111111",
  "corBotaoFundo": "#ffffff",
  "corBotaoTexto": "#111111",
  "corBotaoBorda": "#111111",
  "fonte": "sans"
}'::jsonb
where slug = 'clean';

update temas set configuracao = '{
  "corFundo": "#05010d",
  "corTexto": "#e5e0ff",
  "corBotaoFundo": "#7c3aed",
  "corBotaoTexto": "#ffffff",
  "corBotaoBorda": "#7c3aed",
  "fonte": "mono"
}'::jsonb
where slug = 'dark';
