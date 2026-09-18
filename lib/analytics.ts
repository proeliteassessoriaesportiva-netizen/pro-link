// Agregações em JS sobre as linhas já buscadas do banco — nesse volume
// de dados (perfil de um criador só, não uma rede inteira) não vale a
// complexidade de escrever uma function/view SQL só pra isso.

export function inicioDoIntervalo(dias: number): Date {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data;
}

function chaveDoDia(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export type PontoDaSerie = {
  data: string;
  visualizacoes: number;
  cliques: number;
};

// Preenche todo dia do intervalo com zero, mesmo sem eventos — senão o
// gráfico de linha "salta" nos dias sem dado em vez de mostrar o vale.
export function serieTemporalDiaria(
  dias: number,
  visualizacoes: { ocorrido_em: string }[],
  cliques: { ocorrido_em: string }[],
): PontoDaSerie[] {
  const porDia = new Map<string, PontoDaSerie>();

  for (let i = dias - 1; i >= 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    const chave = data.toISOString().slice(0, 10);
    porDia.set(chave, { data: chave, visualizacoes: 0, cliques: 0 });
  }

  for (const linha of visualizacoes) {
    const ponto = porDia.get(chaveDoDia(linha.ocorrido_em));
    if (ponto) ponto.visualizacoes += 1;
  }

  for (const linha of cliques) {
    const ponto = porDia.get(chaveDoDia(linha.ocorrido_em));
    if (ponto) ponto.cliques += 1;
  }

  return Array.from(porDia.values());
}

export type Contagem = { rotulo: string; valor: number };

// Agrupa por categoria e dobra a cauda em "Outros" — mais de ~7 classes
// coloridas deixa de ser legível (ver anti-patterns do dataviz).
export function contarPorCategoria(
  linhas: Array<Record<string, unknown>>,
  campo: string,
  limiteTopN = 6,
): Contagem[] {
  const contagens = new Map<string, number>();

  for (const linha of linhas) {
    const valor = linha[campo];
    const rotulo = typeof valor === "string" && valor.length > 0 ? valor : "desconhecido";
    contagens.set(rotulo, (contagens.get(rotulo) ?? 0) + 1);
  }

  const ordenado = Array.from(contagens.entries())
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);

  if (ordenado.length <= limiteTopN) return ordenado;

  const principais = ordenado.slice(0, limiteTopN);
  const restante = ordenado
    .slice(limiteTopN)
    .reduce((soma, item) => soma + item.valor, 0);

  return [...principais, { rotulo: "Outros", valor: restante }];
}
