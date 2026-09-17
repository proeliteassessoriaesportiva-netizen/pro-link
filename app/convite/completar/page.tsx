import { completarConvite } from "./actions";

export default async function CompletarConvitePage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={completarConvite}
        className="w-full max-w-sm space-y-4 rounded-lg border border-white/10 p-6"
      >
        <h1 className="text-xl font-semibold">Defina sua senha</h1>
        <p className="text-sm text-white/60">
          Você foi convidado para o Pro Link. Escolha uma senha pra ativar sua conta.
        </p>

        {erro && (
          <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {erro}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-white/70">
            Nova senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmacao" className="text-sm text-white/70">
            Confirmar senha
          </label>
          <input
            id="confirmacao"
            name="confirmacao"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-white py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Ativar conta
        </button>
      </form>
    </main>
  );
}
