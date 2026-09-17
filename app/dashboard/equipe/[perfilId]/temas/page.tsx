import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/dados";
import { atualizarTemasDoPerfil } from "./actions";

export default async function TemasDoPerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ perfilId: string }>;
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const { perfilId } = await params;
  const { erro, sucesso } = await searchParams;

  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();

  // RLS de perfis já restringe a leitura a "próprio ou admin da mesma
  // organização" — perfil de outra organização simplesmente não volta.
  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome_exibicao, slug")
    .eq("id", perfilId)
    .maybeSingle();

  if (!perfil) notFound();

  const [{ data: temas }, { data: concedidos }] = await Promise.all([
    supabase
      .from("temas")
      .select("id, nome, slug")
      .eq("esta_ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("permissoes_template_perfil")
      .select("tema_id")
      .eq("perfil_id", perfilId),
  ]);

  const idsConcedidos = new Set((concedidos ?? []).map((c) => c.tema_id));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        Temas de {perfil.nome_exibicao}{" "}
        <span className="text-sm text-white/40">/{perfil.slug}</span>
      </h1>
      <p className="text-sm text-white/60">
        Marque quais templates essa pessoa pode escolher no próprio editor
        de perfil.
      </p>

      {erro && (
        <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="rounded bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Salvo com sucesso.
        </p>
      )}

      <form action={atualizarTemasDoPerfil} className="space-y-4">
        <input type="hidden" name="perfil_id" value={perfil.id} />

        <ul className="space-y-2">
          {(temas ?? []).map((tema) => (
            <li key={tema.id}>
              <label className="flex items-center gap-2 rounded border border-white/10 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  name="tema_id"
                  value={tema.id}
                  defaultChecked={idsConcedidos.has(tema.id)}
                  className="h-4 w-4"
                />
                {tema.nome}
              </label>
            </li>
          ))}
        </ul>

        <button
          type="submit"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
