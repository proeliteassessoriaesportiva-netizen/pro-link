"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/dados";

export async function atualizarTemasDoPerfil(formData: FormData) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.papel !== "admin") redirect("/dashboard");

  const perfilId = String(formData.get("perfil_id") ?? "");
  const temaIds = formData.getAll("tema_id").map(String);

  const supabase = await createClient();

  // Reconcilia o conjunto todo de uma vez: apaga as concessões que não
  // foram marcadas e insere as novas. RLS garante que só admin da
  // organização do perfil consegue escrever aqui.
  const { error: erroDelete } = await supabase
    .from("permissoes_template_perfil")
    .delete()
    .eq("perfil_id", perfilId)
    .not("tema_id", "in", `(${temaIds.length > 0 ? temaIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);

  if (erroDelete) {
    redirect(
      `/dashboard/equipe/${perfilId}/temas?erro=${encodeURIComponent(erroDelete.message)}`,
    );
  }

  if (temaIds.length > 0) {
    const { error: erroInsert } = await supabase
      .from("permissoes_template_perfil")
      .upsert(
        temaIds.map((temaId) => ({
          perfil_id: perfilId,
          tema_id: temaId,
          concedido_por: usuario.id,
        })),
        { onConflict: "perfil_id,tema_id", ignoreDuplicates: true },
      );

    if (erroInsert) {
      redirect(
        `/dashboard/equipe/${perfilId}/temas?erro=${encodeURIComponent(erroInsert.message)}`,
      );
    }
  }

  revalidatePath(`/dashboard/equipe/${perfilId}/temas`);
  revalidatePath("/dashboard/perfil");
  redirect(`/dashboard/equipe/${perfilId}/temas?sucesso=1`);
}
