import { createClient } from "@/lib/supabase/server";
import type { Usuario, Perfil } from "@/lib/types";

export async function getUsuarioAtual(): Promise<Usuario | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export async function getPerfilDoUsuario(
  usuarioId: string,
): Promise<Perfil | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfis")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return data;
}
