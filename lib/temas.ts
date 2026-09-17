// As cores vêm de JSONB (temas.configuracao) — não têm tipo garantido
// pelo banco, então resolverTema valida campo a campo e cai no padrão
// pra qualquer coisa ausente ou malformada.

export type ConfiguracaoTema = {
  corFundo: string;
  corTexto: string;
  corBotaoFundo: string;
  corBotaoTexto: string;
  corBotaoBorda: string;
  fonte: "sans" | "serif" | "mono";
};

export const TEMA_PADRAO: ConfiguracaoTema = {
  corFundo: "#0a0a0a",
  corTexto: "#ededed",
  corBotaoFundo: "#ffffff",
  corBotaoTexto: "#000000",
  corBotaoBorda: "rgba(255,255,255,0.2)",
  fonte: "sans",
};

const FAMILIAS_DE_FONTE: Record<ConfiguracaoTema["fonte"], string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, serif",
  mono: "ui-monospace, SFMono-Regular, monospace",
};

export function resolverTema(configuracao: unknown): ConfiguracaoTema {
  const c =
    typeof configuracao === "object" && configuracao !== null
      ? (configuracao as Record<string, unknown>)
      : {};

  const campoTexto = (chave: keyof ConfiguracaoTema): string | undefined =>
    typeof c[chave] === "string" ? (c[chave] as string) : undefined;

  const fonte =
    c.fonte === "serif" || c.fonte === "mono" ? c.fonte : "sans";

  return {
    corFundo: campoTexto("corFundo") ?? TEMA_PADRAO.corFundo,
    corTexto: campoTexto("corTexto") ?? TEMA_PADRAO.corTexto,
    corBotaoFundo: campoTexto("corBotaoFundo") ?? TEMA_PADRAO.corBotaoFundo,
    corBotaoTexto: campoTexto("corBotaoTexto") ?? TEMA_PADRAO.corBotaoTexto,
    corBotaoBorda: campoTexto("corBotaoBorda") ?? TEMA_PADRAO.corBotaoBorda,
    fonte,
  };
}

export function familiaDeFonte(fonte: ConfiguracaoTema["fonte"]): string {
  return FAMILIAS_DE_FONTE[fonte];
}
