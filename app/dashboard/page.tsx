import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getPerfilDoUsuario } from "@/lib/dados";
import {
  inicioDoIntervalo,
  serieTemporalDiaria,
  contarPorCategoria,
} from "@/lib/analytics";
import GraficoLinhas from "@/components/graficos/GraficoLinhas";
import GraficoBarras from "@/components/graficos/GraficoBarras";

const PRESETS_DE_DIAS = [7, 30, 90] as const;

function normalizarDias(valor: string | undefined): number {
  const numero = Number(valor);
  return PRESETS_DE_DIAS.includes(numero as 7 | 30 | 90) ? numero : 30;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const { dias: diasParam } = await searchParams;
  const dias = normalizarDias(diasParam);

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
  const desde = inicioDoIntervalo(dias).toISOString();

  const [{ count: totalLinks }, { data: visualizacoes }, { data: cliques }] =
    await Promise.all([
      supabase
        .from("links")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", perfil.id),
      supabase
        .from("visualizacoes_pagina")
        .select("ocorrido_em, origem_referencia, tipo_dispositivo")
        .eq("perfil_id", perfil.id)
        .gte("ocorrido_em", desde),
      supabase
        .from("cliques_link")
        .select("ocorrido_em")
        .eq("perfil_id", perfil.id)
        .gte("ocorrido_em", desde),
    ]);

  const listaDeVisualizacoes = visualizacoes ?? [];
  const listaDeCliques = cliques ?? [];

  const serie = serieTemporalDiaria(dias, listaDeVisualizacoes, listaDeCliques);
  const porOrigem = contarPorCategoria(listaDeVisualizacoes, "origem_referencia");
  const porDispositivo = contarPorCategoria(listaDeVisualizacoes, "tipo_dispositivo");

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

      {/* Uma única linha de filtro no topo — escopa tudo abaixo, pra
          os números nunca ficarem "fora de sincronia" entre os widgets. */}
      <div className="flex gap-2 text-sm">
        {PRESETS_DE_DIAS.map((preset) => (
          <Link
            key={preset}
            href={`/dashboard?dias=${preset}`}
            className={`rounded px-3 py-1.5 ${
              preset === dias
                ? "bg-white text-black"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {preset}d
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-2xl font-semibold">{totalLinks ?? 0}</p>
          <p className="text-sm text-white/60">links ativos</p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-2xl font-semibold">{listaDeVisualizacoes.length}</p>
          <p className="text-sm text-white/60">visualizações ({dias}d)</p>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <p className="text-2xl font-semibold">{listaDeCliques.length}</p>
          <p className="text-sm text-white/60">cliques ({dias}d)</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-4">
        <h2 className="mb-3 text-sm font-medium text-white/70">
          Visualizações e cliques por dia
        </h2>
        <GraficoLinhas dados={serie} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 p-4">
          <h2 className="mb-3 text-sm font-medium text-white/70">
            Origem do tráfego
          </h2>
          <GraficoBarras dados={porOrigem} cor="#3987e5" aria="Visualizações por origem" />
        </div>

        <div className="rounded-lg border border-white/10 p-4">
          <h2 className="mb-3 text-sm font-medium text-white/70">Dispositivo</h2>
          <GraficoBarras
            dados={porDispositivo}
            cor="#199e70"
            aria="Visualizações por tipo de dispositivo"
          />
        </div>
      </div>
    </div>
  );
}
