"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getPerfilDoUsuario } from "@/lib/dados";

export async function atualizarPerfil(formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");

  const perfil = await getPerfilDoUsuario(usuario.id);
  if (!perfil) redirect("/dashboard");

  const campoOuNull = (nome: string) => {
    const valor = String(formData.get(nome) ?? "").trim();
    return valor.length > 0 ? valor : null;
  };

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const temaId = String(formData.get("tema_id") ?? "") || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("perfis")
    .update({
      slug,
      nome_exibicao: String(formData.get("nome_exibicao") ?? "").trim(),
      cargo: campoOuNull("cargo"),
      biografia: campoOuNull("biografia"),
      url_avatar: campoOuNull("url_avatar"),
      url_instagram: campoOuNull("url_instagram"),
      url_youtube: campoOuNull("url_youtube"),
      url_whatsapp: campoOuNull("url_whatsapp"),
      tema_id: temaId,
      esta_ativo: formData.get("esta_ativo") === "on",
      seo_titulo: campoOuNull("seo_titulo"),
      seo_descricao: campoOuNull("seo_descricao"),
      url_imagem_og: campoOuNull("url_imagem_og"),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", perfil.id);

  if (error) {
    const mensagem =
      error.code === "23505"
        ? "Esse slug já está em uso."
        : error.code === "23514"
          ? "Esse slug é reservado pelo sistema."
          : `Não foi possível salvar: ${error.message}`;
    redirect(`/dashboard/perfil?erro=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/dashboard/perfil");
  revalidatePath(`/${perfil.slug}`);
  revalidatePath(`/${slug}`);
  redirect("/dashboard/perfil?sucesso=1");
}
