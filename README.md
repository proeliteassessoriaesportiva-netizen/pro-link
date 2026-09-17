# Pro Link

Plataforma de "link na bio" (estilo Linktree) para a Pro Elite Assessoria Esportiva, com suporte multi-organização desde o schema. Backend em PostgreSQL/Supabase, frontend em Next.js.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + [Tailwind CSS 4](https://tailwindcss.com)
- PostgreSQL via [Supabase](https://supabase.com) (`@supabase/ssr` + `@supabase/supabase-js`)
- Migrations versionadas em [`supabase/migrations`](supabase/migrations)

## Estrutura

```
app/
  login/                      # login com e-mail/senha
  auth/callback/               # troca o code do magic-link/convite por sessão
  convite/completar/           # ativação de conta convidada (define senha, cria perfil)
  dashboard/                   # área logada
    perfil/                    # editor do próprio perfil (bio, redes, tema, SEO)
    links/                     # gerenciador de links (CRUD, ordem, ativo/inativo)
    equipe/                    # admin: convidar/suspender membros da organização
    equipe/[perfilId]/temas/   # admin: conceder/revogar quais temas um perfil pode escolher
  [slug]/                      # página pública do perfil (SSR, registra pageview)
  [slug]/go/[linkSlug]/        # redirecionador de clique — checa dominio_aprovado
  aviso-redirecionamento/      # interstício quando o domínio de destino não está aprovado
lib/
  supabase/                    # clients (browser, server, admin/service-role, anon, middleware)
  dados.ts                     # helpers de leitura (usuário atual, perfil do usuário)
  dominio.ts                   # extração/validação de domínio contra a allowlist
  slug.ts                      # geração de slug único
  rastreamento.ts               # hash de visitante (LGPD) + device/origem pra analytics
  temas.ts                     # resolve temas.configuracao (JSONB) pra cores/fonte, com fallback
  types.ts                     # aliases dos tipos gerados
proxy.ts                       # middleware do Next: renova sessão e protege /dashboard
scripts/
  bootstrap-admin.mjs          # cria o primeiro usuário admin (roda uma vez por ambiente)
supabase/
  config.toml                  # configuração do projeto Supabase local
  migrations/
    20260916000000_initial_schema.sql        # schema inicial (RLS em perfis)
    20260917000000_rls_links_e_analytics.sql # RLS em links, sessoes, visualizacoes_pagina, cliques_link
    20260917010000_rls_usuarios.sql          # RLS em usuarios
    20260917020000_corrige_recursao_rls.sql  # corrige recursão infinita nas policies de "é admin"
    20260917030000_configuracao_temas.sql    # cores/fonte reais dos temas PRO/CLEAN/DARK
    20260917040000_rls_permissoes_template_perfil.sql # RLS em permissoes_template_perfil (admin-only)
  seed.sql                     # dados de exemplo para desenvolvimento local
types/
  database.ts                  # tipos TypeScript gerados a partir do schema (não editar à mão)
```

## Pré-requisitos

- [Node.js](https://nodejs.org) 20+
- [Docker](https://www.docker.com/) (para o Supabase local)
- Supabase CLI — instalada como dev dependency deste projeto (`npm install`), rode com `npx supabase <comando>`

## Configuração

```bash
npm install
cp .env.local.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` com os valores de **Project Settings → API** no [dashboard do Supabase](https://supabase.com/dashboard/project/bcbuzthxrqwdimaihaoi/settings/api). A service role key só é usada em server actions (convite de membros) — nunca é enviada ao navegador.

**Primeiro admin**: o fluxo normal de convite (`dashboard/equipe`) exige estar logado como admin — pra criar o primeiro, rode:

```bash
npm run bootstrap:admin
```

Pede e-mail/senha no terminal e cria o usuário direto pelo service role.

## Rodando localmente

```bash
npx supabase start   # sobe Postgres, Studio, Auth etc. localmente via Docker
npx supabase db reset # aplica as migrations + seed.sql do zero
npm run dev            # sobe o Next.js em http://localhost:3000
```

O Supabase Studio fica disponível em `http://localhost:54323`. Rodando contra o Supabase local, aponte `.env.local` pra `http://127.0.0.1:54321` e as chaves que `supabase start` imprime no terminal.

Contra o projeto remoto já linkado, basta `npm run dev` (com as chaves reais do `.env.local`).

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

**Se `supabase db push`/`projects list` der `LegacyInvalidAccessTokenError`**: provavelmente sobrou uma variável de ambiente `SUPABASE_ACCESS_TOKEN` com lixo/placeholder (ela tem prioridade sobre o login salvo pela CLI). Cheque com `echo $SUPABASE_ACCESS_TOKEN` — se não for um token real (`sbp_...`), remova com `[Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", $null, "User")` no PowerShell (ou `unset SUPABASE_ACCESS_TOKEN` só pra sessão atual do shell).

## Decisões de design do schema

Ver os comentários no topo de [`20260916000000_initial_schema.sql`](supabase/migrations/20260916000000_initial_schema.sql) — cobrem multi-organização, fluxo de convite de usuários, slugs reservados, permissões de template por perfil, proteção contra redirecionador aberto (phishing) e anonimização de dados de analytics (LGPD).

Row Level Security está habilitada em **todas** as tabelas (`usuarios`, `perfis`, `links`, `sessoes`, `visualizacoes_pagina`, `cliques_link`): dono do registro ou admin da organização enxerga/edita; visitante público só enxerga perfis/links ativos e só pode inserir eventos de analytics contra perfis/links ativos. Ver [`20260917000000_rls_links_e_analytics.sql`](supabase/migrations/20260917000000_rls_links_e_analytics.sql) e [`20260917010000_rls_usuarios.sql`](supabase/migrations/20260917010000_rls_usuarios.sql).

Escrita em `usuarios` (convite, ativação, papel) não tem policy pra anon/authenticated de propósito — só passa pelo service role nas server actions (`lib/supabase/admin.ts`), pra impedir que um usuário altere seu próprio papel ou organização.

**Cuidado ao escrever policy de "admin vê tudo da organização"**: a primeira versão checava admin com um subquery direto em `usuarios` dentro da própria policy de `usuarios` — Postgres detecta isso como recursão infinita (`42P17`) e todo SELECT em `usuarios` (e em qualquer tabela cuja policy também checasse admin assim) passava a falhar, quebrando o login inteiro. Corrigido em [`20260917020000_corrige_recursao_rls.sql`](supabase/migrations/20260917020000_corrige_recursao_rls.sql) movendo a checagem pra uma função `security definer` (`e_admin_da_organizacao`), que roda com o dono da tabela e não reaciona a própria RLS.

## Tipos TypeScript

Os tipos em [`types/database.ts`](types/database.ts) são gerados a partir do schema do banco remoto e não devem ser editados à mão. Depois de qualquer migration nova:

```bash
npm run gen:types
```

## Decisões do frontend

- **Convite de membro**: admin convida por e-mail (`dashboard/equipe`) → Supabase Auth manda o magic-link → `/auth/callback` troca o code por sessão → `/convite/completar` define a senha e ativa a conta. Nesse passo também é criado o `perfis` da pessoa (slug derivado do e-mail, começa **inativo** até ela preencher e publicar).
- **`/go/{slug}` global do comentário original do schema virou `/{perfilSlug}/go/{linkSlug}`**: a constraint no banco é `unique (perfil_id, slug)`, não um slug global — então o namespace de redirecionamento precisa ser escopado por perfil pra não colidir entre organizações/perfis diferentes.
- **Link com domínio não aprovado** não é bloqueado, mas também não redireciona direto: cai em `/aviso-redirecionamento`, mostra a URL de destino e pede confirmação manual — o mesmo tipo de interstício que Twitter/Facebook usam pra link não confiável.
- **Analytics (`sessoes`, `visualizacoes_pagina`, `cliques_link`)** são gravados via `after()` do Next (roda depois da resposta ser enviada, não atrasa a página) e são *best-effort*: falha silenciosamente, nunca quebra a navegação do visitante. Cada pageview/clique insere uma linha nova em `sessoes` (sem dedução) — a estimativa de visitante único é `count(distinct hash_visitante)` na hora de consultar, não na hora de gravar. Usa `lib/supabase/anon.ts` (sem cookies) em vez do client de `lib/supabase/server.ts`, porque `cookies()`/`headers()` não podem ser chamados dentro de `after()`; o id da sessão é gerado no cliente (`crypto.randomUUID()`) em vez de ler de volta com `.select()`, porque o visitante anônimo só tem permissão de INSERT nessas tabelas — encadear `.select()` depois do insert não retornaria a linha (RLS filtra o RETURNING).
- **Renderização por template**: `app/[slug]/page.tsx` busca `temas.configuracao` (JSONB: `corFundo`, `corTexto`, `corBotaoFundo`, `corBotaoTexto`, `corBotaoBorda`, `fonte`) do tema escolhido no perfil e aplica via inline `style` — cor dinâmica de dado não pode virar classe Tailwind (o JIT só gera classes que aparecem literalmente no código-fonte, não construídas em runtime a partir do banco). `lib/temas.ts` valida campo a campo e cai no padrão (visual atual, "PRO") pra qualquer coisa ausente/malformada, então um perfil sem tema escolhido nunca quebra. Como `perfis` se relaciona com `temas` de dois jeitos (`tema_id` direto e via `permissoes_template_perfil`), o select precisa nomear a FK (`temas!perfis_tema_id_fkey`) — sem isso o PostgREST recusa o embed por ambiguidade (`PGRST201`).
  - Todo perfil novo (via convite ou `bootstrap-admin`) recebe acesso a todos os temas `esta_ativo = true` automaticamente, pra o seletor nunca ficar vazio. Um admin pode restringir isso pessoa a pessoa em **Equipe → Temas** (`dashboard/equipe/[perfilId]/temas`).
  - `permissoes_template_perfil` não tinha RLS desde o schema inicial — sem isso, qualquer usuário autenticado (não só admin) conseguia se conceder qualquer template via API direta, mesmo com a UI restringindo a escolha visualmente. Corrigido em [`20260917040000_rls_permissoes_template_perfil.sql`](supabase/migrations/20260917040000_rls_permissoes_template_perfil.sql): leitura é própria-ou-admin, escrita (conceder/revogar) é admin-only.

### Revisão da parte pública (bio, clique, aviso)

Depois de validar o fluxo end-to-end, revisei especificamente o que fica visível pra quem clica no link da bio — perfil público, redirecionamento de clique e o aviso de domínio não aprovado. Achados:

- **[Corrigido] XSS em `/aviso-redirecionamento`**: a página confiava cegamente em `destino`/`voltar` da query string e renderizava direto como `href`. Como essa rota é acessível diretamente (não só via `/go`), dava pra montar `?destino=javascript:...` e rodar JS arbitrário na origem do site se a vítima clicasse "Continuar mesmo assim" — a própria página de aviso de segurança virando vetor de ataque. `voltar` tinha o mesmo problema pra phishing (parecer que tá "voltando" mas sair pra um domínio externo). Agora `destino` só é aceito se for URL http(s) válida e `voltar` só se for path relativo interno; qualquer outra coisa some da tela sem quebrar a página. Ver `app/aviso-redirecionamento/page.tsx`.
- **[Corrigido] 404 fora do tema**: perfil inexistente/desativado caía no 404 padrão do Next (fundo branco), destoando do resto do site escuro. Adicionado `app/not-found.tsx`.
- **[Observação, não crítico]** Clique em link navega no mesmo tab (sem `target="_blank"`) — é o mesmo padrão do Linktree e funciona bem dentro do browser in-app do Instagram/WhatsApp (tem botão voltar), então não mexi.
- **[Observação, não crítico]** As CSS custom properties `--cor-fundo`/`--cor-texto` em `globals.css` só são usadas no `body`; o resto do app usa classes Tailwind literais. Não é bug, só inconsistência de padrão — baixa prioridade.
