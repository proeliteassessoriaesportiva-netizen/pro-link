import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import {
  hashVisitante,
  tipoDispositivo,
  origemReferencia,
} from "@/lib/rastreamento";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; linkSlug: string }> },
) {
  const { slug, linkSlug } = await params;
  const supabase = await createClient();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id")
    .eq("slug", slug)
    .eq("esta_ativo", true)
    .maybeSingle();

  if (!perfil) {
    return NextResponse.redirect(new URL(`/${slug}`, request.url));
  }

  const { data: link } = await supabase
    .from("links")
    .select("*")
    .eq("perfil_id", perfil.id)
    .eq("slug", linkSlug)
    .eq("esta_ativo", true)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect(new URL(`/${slug}`, request.url));
  }

  const [hash, dispositivo, origem] = await Promise.all([
    hashVisitante(),
    tipoDispositivo(),
    origemReferencia(),
  ]);

  after(async () => {
    try {
      // Client sem cookies: cookies()/headers() não podem ser chamados
      // dentro de after(), e essa escrita é anônima mesmo.
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

      await cliente.from("cliques_link").insert({
        link_id: link.id,
        perfil_id: perfil.id,
        sessao_id: sessaoId,
        tipo_dispositivo: dispositivo,
      });
    } catch {
      // analytics nunca deve quebrar o redirecionamento
    }
  });

  // Domínio ainda não aprovado pra organização: mostra aviso em vez de
  // redirecionar direto — fecha o redirecionador aberto (risco de phishing).
  if (!link.dominio_aprovado) {
    const aviso = new URL("/aviso-redirecionamento", request.url);
    aviso.searchParams.set("destino", link.url_destino);
    aviso.searchParams.set("voltar", `/${slug}`);
    return NextResponse.redirect(aviso);
  }

  return NextResponse.redirect(link.url_destino);
}
