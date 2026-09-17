import { NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
      const cliente = await createClient();
      const { data: sessao } = await cliente
        .from("sessoes")
        .insert({
          perfil_id: perfil.id,
          hash_visitante: hash,
          origem_referencia: origem,
        })
        .select("id")
        .single();

      await cliente.from("cliques_link").insert({
        link_id: link.id,
        perfil_id: perfil.id,
        sessao_id: sessao?.id ?? null,
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
