"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dados";
import { createAdminClient } from "@/lib/supabase/admin";

async function exigirAdmin() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.papel !== "admin") redirect("/dashboard");
  return usuario;
}

export async function convidarMembro(formData: FormData) {
  const usuario = await exigirAdmin();

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const papel = String(formData.get("papel") ?? "membro") as
    | "admin"
    | "membro";

  if (!email) {
    redirect(`/dashboard/equipe?erro=${encodeURIComponent("E-mail obrigatório")}`);
  }

  const admin = createAdminClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/convite/completar`,
  });

  if (error || !data.user) {
    redirect(
      `/dashboard/equipe?erro=${encodeURIComponent(error?.message ?? "Não foi possível convidar esse e-mail")}`,
    );
  }

  const { error: erroInsert } = await admin.from("usuarios").insert({
    id: data.user.id,
    organizacao_id: usuario.organizacao_id,
    email,
    papel,
    status: "convidado",
    convidado_por: usuario.id,
  });

  if (erroInsert) {
    redirect(`/dashboard/equipe?erro=${encodeURIComponent(erroInsert.message)}`);
  }

  revalidatePath("/dashboard/equipe");
  redirect("/dashboard/equipe?sucesso=1");
}

export async function alternarStatusMembro(formData: FormData) {
  const usuario = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const statusAtual = String(formData.get("status") ?? "");

  if (id === usuario.id) {
    redirect(
      `/dashboard/equipe?erro=${encodeURIComponent("Você não pode suspender a si mesmo")}`,
    );
  }

  const novoStatus = statusAtual === "suspenso" ? "ativo" : "suspenso";

  const admin = createAdminClient();
  await admin
    .from("usuarios")
    .update({ status: novoStatus })
    .eq("id", id)
    .eq("organizacao_id", usuario.organizacao_id);

  revalidatePath("/dashboard/equipe");
}
