// Cria o primeiro usuário admin, direto pelo service role — não dá pra
// usar o fluxo normal de convite (dashboard/equipe) porque ele exige
// já estar logado como admin. Rode uma vez por ambiente:
//
//   node --env-file=.env.local scripts/bootstrap-admin.mjs
//
// Pede e-mail/senha no próprio terminal (nunca ficam em arquivo).

import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey || serviceRoleKey.startsWith("placeholder")) {
  console.error(
    "Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local antes de rodar este script.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// BOOTSTRAP_EMAIL/BOOTSTRAP_PASSWORD permitem rodar sem prompt (ex: CI,
// ou terminais onde stdin via pipe não segura pro readline interativo).
let email = process.env.BOOTSTRAP_EMAIL?.trim().toLowerCase();
let password = process.env.BOOTSTRAP_PASSWORD;

if (!email || !password) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  email ??= (await rl.question("E-mail do admin: ")).trim().toLowerCase();
  password ??= await rl.question("Senha (mín. 8 caracteres): ");
  rl.close();
}

if (password.length < 8) {
  console.error("Senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const { data: org, error: orgError } = await admin
  .from("organizacoes")
  .select("id")
  .eq("slug", "pro-elite")
  .single();

if (orgError || !org) {
  console.error(
    "Organização 'pro-elite' não encontrada — rode `npx supabase db push` (aplica o seed.sql) primeiro.",
  );
  process.exit(1);
}

const { data: usuarioData, error: userError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (userError || !usuarioData.user) {
  console.error(`Não foi possível criar o usuário: ${userError?.message}`);
  process.exit(1);
}

const { error: usuarioError } = await admin.from("usuarios").insert({
  id: usuarioData.user.id,
  organizacao_id: org.id,
  email,
  papel: "admin",
  status: "ativo",
  ativado_em: new Date().toISOString(),
});

if (usuarioError) {
  console.error(`Usuário criado no Auth, mas falhou ao gravar em 'usuarios': ${usuarioError.message}`);
  process.exit(1);
}

const slug = email
  .split("@")[0]
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const { error: perfilError } = await admin.from("perfis").insert({
  organizacao_id: org.id,
  usuario_id: usuarioData.user.id,
  slug,
  nome_exibicao: email.split("@")[0],
  esta_ativo: false,
});

if (perfilError) {
  console.error(`Usuário admin criado, mas falhou ao criar o perfil: ${perfilError.message}`);
  process.exit(1);
}

console.log(`\nAdmin criado: ${email} (perfil em /${slug}, inativo até você publicar).`);
console.log("Já pode fazer login em /login com esse e-mail e senha.");
