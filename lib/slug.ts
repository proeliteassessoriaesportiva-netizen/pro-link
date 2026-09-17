import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function slugificar(texto: string): string {
  const limpo = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return limpo || "perfil";
}

// Gera um slug único dentro da organização, evitando slugs reservados
// (validado também pela constraint slug_nao_reservado no banco) e
// colisão com perfis existentes.
export async function gerarSlugUnicoDePerfil(
  admin: SupabaseClient<Database>,
  organizacaoId: string,
  base: string,
): Promise<string> {
  const baseSlug = slugificar(base);

  const { data: reservados } = await admin
    .from("slugs_reservados")
    .select("slug");
  const setReservados = new Set(reservados?.map((r) => r.slug) ?? []);

  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const candidato =
      tentativa === 0 ? baseSlug : `${baseSlug}-${tentativa + 1}`;

    if (setReservados.has(candidato)) continue;

    const { data: existente } = await admin
      .from("perfis")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .eq("slug", candidato)
      .maybeSingle();

    if (!existente) return candidato;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}
