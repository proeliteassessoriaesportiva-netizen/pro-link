import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getPerfilDoUsuario } from "@/lib/dados";

function dataTrintaDiasAtras(): string {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

export default async function DashboardPage() {
  const usuario = await getUsuarioAtual();
  const perfil = usuario ? await getPerfilDoUsuario(usuario.id) : null;

  if (!perfil) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Visão geral</h1>
        <p className="text-sm text-white/60">
          Nenhum perfil encontrado pra sua conta ainda. Fale com um admin.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const trintaDiasAtras = dataTrintaDiasAtras();

  const [{ count: totalLinks }, { count: visualizacoes30d }, { count: cliques30d }] =
    await Promise.all([
      supabase
        .from("links")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", perfil.id),
      supabase
        .from("visualizacoes_pagina")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", perfil.id)
        .gte("ocorrido_em", trintaDiasAtras),
      supabase
        .from("cliques_link")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", perfil.id)
        .gte("ocorrido_em", trintaDiasAtras),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Visão geral</h1>
        <p className="text-sm text-white/60">
          {perfil.esta_ativo ? (
            <>
              Sua página está no ar em{" "}
              <Link href={`/${perfil.slug}`} className="underline" target="_blank">
                /{perfil.slug}
              </Link>
            </>
          ) : (
            <>Sua página ainda não está ativa — ative em Perfil.</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-2xl font-semibold">{totalLinks ?? 0}</p>
          <p className="text-sm text-white/60">links ativos</p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-2xl font-semibold">{visualizacoes30d ?? 0}</p>
          <p className="text-sm text-white/60">visualizações (30d)</p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-2xl font-semibold">{cliques30d ?? 0}</p>
          <p className="text-sm text-white/60">cliques (30d)</p>
        </div>
      </div>
    </div>
  );
}
