"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { gerarSlugUnicoDePerfil } from "@/lib/slug";

export async function completarConvite(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (password.length < 8) {
    redirect(
      `/convite/completar?erro=${encodeURIComponent("A senha precisa ter pelo menos 8 caracteres")}`,
    );
  }

  if (password !== confirmacao) {
    redirect(
      `/convite/completar?erro=${encodeURIComponent("As senhas não coincidem")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/convite/completar?erro=${encodeURIComponent(error.message)}`);
  }

  // Passa pelo service role: usuarios não tem policy de update/insert
  // pro próprio usuário (evita que alguém altere seu próprio papel/org,
  // ou crie perfis arbitrários).
  const admin = createAdminClient();

  const { data: usuarioRow } = await admin
    .from("usuarios")
    .update({ status: "ativo", ativado_em: new Date().toISOString() })
    .eq("id", user.id)
    .eq("status", "convidado")
    .select("id, organizacao_id, email")
    .maybeSingle();

  if (usuarioRow) {
    const { data: perfilExistente } = await admin
      .from("perfis")
      .select("id")
      .eq("usuario_id", usuarioRow.id)
      .maybeSingle();

    if (!perfilExistente) {
      const nomeBase = usuarioRow.email.split("@")[0];
      const slug = await gerarSlugUnicoDePerfil(
        admin,
        usuarioRow.organizacao_id,
        nomeBase,
      );

      await admin.from("perfis").insert({
        organizacao_id: usuarioRow.organizacao_id,
        usuario_id: usuarioRow.id,
        slug,
        nome_exibicao: nomeBase,
        esta_ativo: false,
      });
    }
  }

  redirect("/dashboard");
}
