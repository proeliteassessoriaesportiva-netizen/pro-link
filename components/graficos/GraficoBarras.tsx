"use client";

import { useState } from "react";
import type { Contagem } from "@/lib/analytics";

export default function GraficoBarras({
  dados,
  cor,
  aria,
}: {
  dados: Contagem[];
  cor: string;
  aria: string;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const [mostrarTabela, setMostrarTabela] = useState(false);

  const maximo = Math.max(1, ...dados.map((d) => d.valor));

  if (dados.length === 0) {
    return <p className="text-sm text-white/50">Sem dados nesse período.</p>;
  }

  return (
    <div className="space-y-3" role="img" aria-label={aria}>
      <ul className="space-y-2.5">
        {dados.map((item, i) => (
          <li key={item.rotulo}>
            <button
              type="button"
              className="group grid w-full grid-cols-[7rem_1fr_2.5rem] items-center gap-2 rounded text-left"
              onPointerEnter={() => setAtivo(i)}
              onPointerLeave={() => setAtivo(null)}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
            >
              <span className="truncate text-xs text-white/70">{item.rotulo}</span>
              <span className="h-5 rounded-r bg-white/5">
                <span
                  className="block h-5 rounded-r transition-opacity group-hover:opacity-80"
                  style={{
                    width: `${Math.max(4, (item.valor / maximo) * 100)}%`,
                    background: cor,
                  }}
                />
              </span>
              <span className="text-right text-xs tabular-nums text-white/70">
                {item.valor}
              </span>
            </button>

            {ativo === i && (
              <p className="pl-1 text-[11px] text-white/40">
                <strong className="text-white/70">{item.valor}</strong> em{" "}
                {item.rotulo}
              </p>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setMostrarTabela((v) => !v)}
        className="text-xs text-white/50 underline hover:text-white/80"
      >
        {mostrarTabela ? "Ocultar tabela" : "Ver como tabela"}
      </button>

      {mostrarTabela && (
        <table className="w-full text-left text-xs">
          <tbody>
            {dados.map((item) => (
              <tr key={item.rotulo} className="border-t border-white/10">
                <td className="py-1 pr-4">{item.rotulo}</td>
                <td className="py-1 tabular-nums">{item.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
