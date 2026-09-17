import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; redirectTo?: string }>;
}) {
  const { erro, redirectTo } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg border border-white/10 p-6"
      >
        <h1 className="text-xl font-semibold">Entrar — Pro Link</h1>

        {erro && (
          <p className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {erro}
          </p>
        )}

        <input type="hidden" name="redirectTo" value={redirectTo ?? "/dashboard"} />

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-white/70">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-white/70">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-white/50"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-white py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
