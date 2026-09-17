import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getPerfilDoUsuario } from "@/lib/dados";
import {
  adicionarLink,
  atualizarLink,
  removerLink,
  alternarLinkAtivo,
  moverLink,
} from "./actions";

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const usuario = await getUsuarioAtual();
  if (!usuario) return null;

  const perfil = await getPerfilDoUsuario(usuario.id);
  if (!perfil) {
    return (
      <p className="text-sm text-white/60">
        Nenhum perfil encontrado pra sua conta ainda. Fale com um admin.
      </p>
    );
  }

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("perfil_id", perfil.id)
    .order("posicao", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Links</h1>

      {erro && (
        <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {erro}
        </p>
      )}

      <ul className="space-y-3">
        {(links ?? []).map((link, indice) => (
          <li
            key={link.id}
            className="space-y-3 rounded-lg border border-white/10 p-4"
          >
            <form action={atualizarLink} className="grid grid-cols-2 gap-2">
              <input type="hidden" name="id" value={link.id} />
              <input
                name="titulo"
                defaultValue={link.titulo}
                required
                className="rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
              />
              <input
                name="url_destino"
                type="url"
                defaultValue={link.url_destino}
                required
                className="rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
              />
              <input
                name="descricao"
                defaultValue={link.descricao ?? ""}
                placeholder="Descrição (opcional)"
                className="col-span-2 rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
              />
              <div className="col-span-2 flex items-center justify-between">
                <span
                  className={`text-xs ${link.dominio_aprovado ? "text-green-400" : "text-yellow-400"}`}
                >
                  {link.dominio_aprovado
                    ? `Domínio aprovado: ${link.dominio_destino}`
                    : `Domínio não aprovado ainda: ${link.dominio_destino} — visitantes verão um aviso antes de continuar`}
                </span>
                <button
                  type="submit"
                  className="rounded bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                >
                  Salvar
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2">
              <form action={moverLink}>
                <input type="hidden" name="id" value={link.id} />
                <input type="hidden" name="direcao" value="cima" />
                <button
                  type="submit"
                  disabled={indice === 0}
                  className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20 disabled:opacity-30"
                >
                  ↑
                </button>
              </form>
              <form action={moverLink}>
                <input type="hidden" name="id" value={link.id} />
                <input type="hidden" name="direcao" value="baixo" />
                <button
                  type="submit"
                  disabled={indice === (links?.length ?? 0) - 1}
                  className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20 disabled:opacity-30"
                >
                  ↓
                </button>
              </form>

              <form action={alternarLinkAtivo}>
                <input type="hidden" name="id" value={link.id} />
                <input type="hidden" name="ativo" value={String(link.esta_ativo)} />
                <button
                  type="submit"
                  className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                >
                  {link.esta_ativo ? "Desativar" : "Ativar"}
                </button>
              </form>

              <form action={removerLink}>
                <input type="hidden" name="id" value={link.id} />
                <button
                  type="submit"
                  className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                >
                  Remover
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form
        action={adicionarLink}
        className="space-y-3 rounded-lg border border-dashed border-white/20 p-4"
      >
        <h2 className="text-sm font-medium text-white/70">Novo link</h2>
        <input
          name="titulo"
          placeholder="Título"
          required
          className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
        />
        <input
          name="url_destino"
          type="url"
          placeholder="https://..."
          required
          className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
        />
        <input
          name="descricao"
          placeholder="Descrição (opcional)"
          className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
        />
        <button
          type="submit"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}
