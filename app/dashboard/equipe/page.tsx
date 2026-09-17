import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/dados";
import { convidarMembro, alternarStatusMembro } from "./actions";

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const { erro, sucesso } = await searchParams;
  const usuario = await getUsuarioAtual();
  if (!usuario) return null;
  if (usuario.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: membros } = await supabase
    .from("usuarios")
    .select("*, perfis ( id, slug )")
    .eq("organizacao_id", usuario.organizacao_id)
    .order("criado_em", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Equipe</h1>

      {erro && (
        <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="rounded bg-green-500/10 px-3 py-2 text-sm text-green-400">
          Convite enviado.
        </p>
      )}

      <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
        {(membros ?? []).map((membro) => (
          <li
            key={membro.id}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <div>
              <p>{membro.email}</p>
              <p className="text-xs text-white/50">
                {membro.papel} · {membro.status}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {membro.perfis && (
                <Link
                  href={`/dashboard/equipe/${membro.perfis.id}/temas`}
                  className="rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                >
                  Temas
                </Link>
              )}

              {membro.id !== usuario.id && (
                <form action={alternarStatusMembro}>
                  <input type="hidden" name="id" value={membro.id} />
                  <input type="hidden" name="status" value={membro.status} />
                  <button
                    type="submit"
                    className="rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    {membro.status === "suspenso" ? "Reativar" : "Suspender"}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>

      <form
        action={convidarMembro}
        className="space-y-3 rounded-lg border border-dashed border-white/20 p-4"
      >
        <h2 className="text-sm font-medium text-white/70">Convidar membro</h2>
        <input
          name="email"
          type="email"
          placeholder="email@exemplo.com"
          required
          className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
        />
        <select
          name="papel"
          defaultValue="membro"
          className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
        >
          <option value="membro">Membro</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Enviar convite
        </button>
      </form>
    </div>
  );
}
