export default async function AvisoRedirecionamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; voltar?: string }>;
}) {
  const { destino, voltar } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
        <h1 className="text-lg font-semibold">Link ainda não verificado</h1>
        <p className="text-sm text-white/70">
          Esse link aponta pra um domínio que o administrador ainda não
          aprovou. Confira o endereço com atenção antes de continuar.
        </p>

        {destino && (
          <p className="break-all rounded bg-black/30 px-3 py-2 font-mono text-xs text-white/60">
            {destino}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          {destino && (
            <a
              href={destino}
              rel="noopener noreferrer"
              className="rounded bg-white py-2 text-sm font-medium text-black hover:bg-white/90"
            >
              Continuar mesmo assim
            </a>
          )}
          {voltar && (
            <a
              href={voltar}
              className="rounded border border-white/20 py-2 text-sm hover:bg-white/5"
            >
              Voltar
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
