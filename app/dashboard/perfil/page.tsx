import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getPerfilDoUsuario } from "@/lib/dados";
import { atualizarPerfil } from "./actions";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const { erro, sucesso } = await searchParams;
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
  const { data: permissoes } = await supabase
    .from("permissoes_template_perfil")
    .select("temas ( id, nome, slug )")
    .eq("perfil_id", perfil.id);

  const temasPermitidos = (permissoes ?? [])
    .map((p) => p.temas)
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Perfil</h1>

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

      <form action={atualizarPerfil} className="space-y-4">
        <Campo label="URL da página">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-white/40">/</span>
            <input
              name="slug"
              defaultValue={perfil.slug}
              required
              className="flex-1 rounded border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white/50"
            />
          </div>
        </Campo>

        <Campo label="Nome de exibição">
          <input
            name="nome_exibicao"
            defaultValue={perfil.nome_exibicao}
            required
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </Campo>

        <Campo label="Cargo">
          <input
            name="cargo"
            defaultValue={perfil.cargo ?? ""}
            placeholder="Treinador de corrida"
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </Campo>

        <Campo label="Biografia">
          <textarea
            name="biografia"
            defaultValue={perfil.biografia ?? ""}
            rows={3}
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </Campo>

        <Campo label="URL do avatar">
          <input
            name="url_avatar"
            type="url"
            defaultValue={perfil.url_avatar ?? ""}
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </Campo>

        <div className="grid grid-cols-3 gap-4">
          <Campo label="Instagram">
            <input
              name="url_instagram"
              type="url"
              defaultValue={perfil.url_instagram ?? ""}
              className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
            />
          </Campo>
          <Campo label="YouTube">
            <input
              name="url_youtube"
              type="url"
              defaultValue={perfil.url_youtube ?? ""}
              className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
            />
          </Campo>
          <Campo label="WhatsApp">
            <input
              name="url_whatsapp"
              type="url"
              defaultValue={perfil.url_whatsapp ?? ""}
              className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
            />
          </Campo>
        </div>

        <Campo label="Template">
          {temasPermitidos.length === 0 ? (
            <p className="text-sm text-white/50">
              Nenhum template liberado pelo admin ainda.
            </p>
          ) : (
            <select
              name="tema_id"
              defaultValue={perfil.tema_id ?? ""}
              className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
            >
              <option value="">Padrão</option>
              {temasPermitidos.map((tema) => (
                <option key={tema.id} value={tema.id}>
                  {tema.nome}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <fieldset className="space-y-2 rounded border border-white/10 p-4">
          <legend className="px-1 text-sm text-white/70">SEO</legend>
          <Campo label="Título">
            <input
              name="seo_titulo"
              defaultValue={perfil.seo_titulo ?? ""}
              className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
            />
          </Campo>
          <Campo label="Descrição">
            <input
              name="seo_descricao"
              defaultValue={perfil.seo_descricao ?? ""}
              className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
            />
          </Campo>
          <Campo label="Imagem (og:image)">
            <input
              name="url_imagem_og"
              type="url"
              defaultValue={perfil.url_imagem_og ?? ""}
              className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
            />
          </Campo>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="esta_ativo"
            defaultChecked={perfil.esta_ativo}
            className="h-4 w-4"
          />
          Página pública ativa
        </label>

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

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-white/70">{label}</label>
      {children}
    </div>
  );
}
