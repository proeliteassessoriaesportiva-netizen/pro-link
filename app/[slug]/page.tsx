import { notFound } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import {
  hashVisitante,
  tipoDispositivo,
  origemReferencia,
} from "@/lib/rastreamento";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_exibicao, seo_titulo, seo_descricao, url_imagem_og")
    .eq("slug", slug)
    .eq("esta_ativo", true)
    .maybeSingle();

  if (!perfil) return {};

  return {
    title: perfil.seo_titulo ?? perfil.nome_exibicao,
    description: perfil.seo_descricao ?? undefined,
    openGraph: perfil.url_imagem_og
      ? { images: [perfil.url_imagem_og] }
      : undefined,
  };
}

export default async function PaginaPublicaDoPerfil({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("*")
    .eq("slug", slug)
    .eq("esta_ativo", true)
    .maybeSingle();

  if (!perfil) notFound();

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("perfil_id", perfil.id)
    .eq("esta_ativo", true)
    .order("posicao", { ascending: true });

  const [hash, dispositivo, origem] = await Promise.all([
    hashVisitante(),
    tipoDispositivo(),
    origemReferencia(),
  ]);

  // Best-effort: roda depois da resposta ser enviada, sem atrasar o
  // carregamento da página pública.
  after(async () => {
    try {
      // Client sem cookies: cookies()/headers() não podem ser chamados
      // dentro de after(), e essa escrita é anônima mesmo (não depende
      // da sessão de quem está logado, se houver).
      // Gera o id no cliente: o visitante anônimo só tem permissão de
      // INSERT em sessoes (não SELECT), então encadear .select() depois
      // do insert não retornaria a linha (RLS filtra o RETURNING).
      const sessaoId = crypto.randomUUID();
      const cliente = createAnonClient();

      await cliente.from("sessoes").insert({
        id: sessaoId,
        perfil_id: perfil.id,
        hash_visitante: hash,
        origem_referencia: origem,
      });

      await cliente.from("visualizacoes_pagina").insert({
        perfil_id: perfil.id,
        sessao_id: sessaoId,
        origem_referencia: origem,
        tipo_dispositivo: dispositivo,
      });
    } catch {
      // analytics nunca deve quebrar a página pública
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-12 text-center">
      {perfil.url_avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={perfil.url_avatar}
          alt={perfil.nome_exibicao}
          className="h-24 w-24 rounded-full object-cover"
        />
      )}

      <div>
        <h1 className="text-xl font-semibold">{perfil.nome_exibicao}</h1>
        {perfil.cargo && (
          <p className="text-sm text-white/60">{perfil.cargo}</p>
        )}
      </div>

      {perfil.biografia && (
        <p className="text-sm text-white/70">{perfil.biografia}</p>
      )}

      <ul className="w-full space-y-3">
        {(links ?? []).map((link) => (
          <li key={link.id}>
            <a
              href={`/${perfil.slug}/go/${link.slug}`}
              className="block w-full rounded-lg border border-white/20 px-4 py-3 text-sm hover:bg-white/5"
            >
              {link.titulo}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
