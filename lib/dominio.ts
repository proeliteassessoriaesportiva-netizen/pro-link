import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function extrairDominio(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Fecha o redirecionador aberto: só considera aprovado um domínio que
// bate exatamente com a allowlist da organização, ou é subdomínio dela
// quando permite_subdominio_curinga = true.
export async function dominioEstaAprovado(
  supabase: SupabaseClient<Database>,
  organizacaoId: string,
  dominio: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("dominios_redirecionamento_permitidos")
    .select("dominio, permite_subdominio_curinga")
    .eq("organizacao_id", organizacaoId);

  if (!data) return false;

  return data.some(({ dominio: permitido, permite_subdominio_curinga }) => {
    const permitidoLower = permitido.toLowerCase();
    if (dominio === permitidoLower) return true;
    if (permite_subdominio_curinga && dominio.endsWith(`.${permitidoLower}`)) {
      return true;
    }
    return false;
  });
}
