// destino/voltar vêm da query string — qualquer um pode montar essa URL
// direto (não só via /go), então não dá pra confiar neles sem validar.
// Sem isso, um link tipo ?destino=javascript:... rodaria JS arbitrário na
// origem do site quando a vítima clicasse "Continuar mesmo assim" — a
// própria página de aviso de segurança virando vetor de XSS.
function destinoSeguro(destino: string | undefined): string | null {
  if (!destino) return null;
  try {
    const url = new URL(destino);
    return url.protocol === "http:" || url.protocol === "https:"
      ? destino
      : null;
  } catch {
    return null;
  }
}

// "Voltar" só pode apontar pra dentro do próprio site — senão vira
// phishing (parece que você tá voltando, mas na verdade sai pro
// domínio que o atacante escolheu).
function voltarSeguro(voltar: string | undefined): string | null {
  if (!voltar) return null;
  return voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : null;
}

export default async function AvisoRedirecionamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; voltar?: string }>;
}) {
  const params = await searchParams;
  const destino = destinoSeguro(params.destino);
  const voltar = voltarSeguro(params.voltar);

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
              rel="nofollow noopener noreferrer"
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
