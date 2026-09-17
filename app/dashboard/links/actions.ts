"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getPerfilDoUsuario } from "@/lib/dados";
import { extrairDominio, dominioEstaAprovado } from "@/lib/dominio";
import { slugificar } from "@/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

async function perfilAtualOuRedirecionar() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const perfil = await getPerfilDoUsuario(usuario.id);
  if (!perfil) redirect("/dashboard");
  return perfil;
}

function erro(mensagem: string): never {
  redirect(`/dashboard/links?erro=${encodeURIComponent(mensagem)}`);
}

async function slugUnicoDeLink(
  supabase: SupabaseClient<Database>,
  perfilId: string,
  base: string,
  ignorarLinkId?: string,
): Promise<string> {
  const baseSlug = slugificar(base);

  for (let tentativa = 0; tentativa < 20; tentativa++) {
    const candidato = tentativa === 0 ? baseSlug : `${baseSlug}-${tentativa + 1}`;

    let query = supabase
      .from("links")
      .select("id")
      .eq("perfil_id", perfilId)
      .eq("slug", candidato);

    if (ignorarLinkId) {
      query = query.neq("id", ignorarLinkId);
    }

    const { data } = await query.maybeSingle();
    if (!data) return candidato;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function adicionarLink(formData: FormData) {
  const perfil = await perfilAtualOuRedirecionar();
  const supabase = await createClient();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const urlDestino = String(formData.get("url_destino") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  if (!titulo || !urlDestino) {
    erro("Título e URL de destino são obrigatórios.");
  }

  const dominio = extrairDominio(urlDestino);
  if (!dominio) {
    erro("URL de destino inválida.");
  }

  const aprovado = await dominioEstaAprovado(
    supabase,
    perfil.organizacao_id,
    dominio,
  );

  const slug = await slugUnicoDeLink(supabase, perfil.id, titulo);

  const { count } = await supabase
    .from("links")
    .select("id", { count: "exact", head: true })
    .eq("perfil_id", perfil.id);

  const { error: erroInsert } = await supabase.from("links").insert({
    perfil_id: perfil.id,
    titulo,
    url_destino: urlDestino,
    dominio_destino: dominio,
    dominio_aprovado: aprovado,
    descricao,
    slug,
    posicao: count ?? 0,
  });

  if (erroInsert) {
    erro(`Não foi possível criar o link: ${erroInsert.message}`);
  }

  revalidatePath("/dashboard/links");
  revalidatePath(`/${perfil.slug}`);
}

export async function atualizarLink(formData: FormData) {
  const perfil = await perfilAtualOuRedirecionar();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const urlDestino = String(formData.get("url_destino") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  if (!id || !titulo || !urlDestino) {
    erro("Título e URL de destino são obrigatórios.");
  }

  const dominio = extrairDominio(urlDestino);
  if (!dominio) {
    erro("URL de destino inválida.");
  }

  const aprovado = await dominioEstaAprovado(
    supabase,
    perfil.organizacao_id,
    dominio,
  );

  const { error: erroUpdate } = await supabase
    .from("links")
    .update({
      titulo,
      url_destino: urlDestino,
      dominio_destino: dominio,
      dominio_aprovado: aprovado,
      descricao,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("perfil_id", perfil.id);

  if (erroUpdate) {
    erro(`Não foi possível salvar o link: ${erroUpdate.message}`);
  }

  revalidatePath("/dashboard/links");
  revalidatePath(`/${perfil.slug}`);
}

export async function removerLink(formData: FormData) {
  const perfil = await perfilAtualOuRedirecionar();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  await supabase.from("links").delete().eq("id", id).eq("perfil_id", perfil.id);

  revalidatePath("/dashboard/links");
  revalidatePath(`/${perfil.slug}`);
}

export async function alternarLinkAtivo(formData: FormData) {
  const perfil = await perfilAtualOuRedirecionar();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const ativoAtual = formData.get("ativo") === "true";

  await supabase
    .from("links")
    .update({ esta_ativo: !ativoAtual })
    .eq("id", id)
    .eq("perfil_id", perfil.id);

  revalidatePath("/dashboard/links");
  revalidatePath(`/${perfil.slug}`);
}

export async function moverLink(formData: FormData) {
  const perfil = await perfilAtualOuRedirecionar();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const direcao = String(formData.get("direcao") ?? "");

  const { data: links } = await supabase
    .from("links")
    .select("id, posicao")
    .eq("perfil_id", perfil.id)
    .order("posicao", { ascending: true });

  if (!links) return;

  const indice = links.findIndex((l) => l.id === id);
  const indiceVizinho = direcao === "cima" ? indice - 1 : indice + 1;

  if (indice === -1 || indiceVizinho < 0 || indiceVizinho >= links.length) {
    return;
  }

  const atual = links[indice];
  const vizinho = links[indiceVizinho];

  await Promise.all([
    supabase
      .from("links")
      .update({ posicao: vizinho.posicao })
      .eq("id", atual.id),
    supabase
      .from("links")
      .update({ posicao: atual.posicao })
      .eq("id", vizinho.id),
  ]);

  revalidatePath("/dashboard/links");
  revalidatePath(`/${perfil.slug}`);
}
