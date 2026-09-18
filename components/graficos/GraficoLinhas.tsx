"use client";

import { useMemo, useRef, useState } from "react";
import type { PontoDaSerie } from "@/lib/analytics";

const COR_VISUALIZACOES = "#3987e5"; // categórico slot 1 (azul)
const COR_CLIQUES = "#d95926"; // categórico slot 2 (laranja)
const COR_GRADE = "#2c2c2a";
const COR_EIXO = "#383835";
const COR_TEXTO_MUTED = "#898781";
const COR_SUPERFICIE = "#0a0a0a"; // mesmo fundo da página — anel dos marcadores

const LARGURA = 700;
const ALTURA_GRAFICO = 200;
const ALTURA_TOTAL = 240; // inclui a faixa do eixo X
const PAD_ESQ = 40;
const PAD_DIR = 16;

function formatarDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

function tetoLimpo(valorMaximo: number): number {
  if (valorMaximo <= 5) return 5;
  const grandeza = Math.pow(10, Math.floor(Math.log10(valorMaximo)));
  const passos = [1, 2, 5, 10];
  for (const passo of passos) {
    const teto = passo * grandeza;
    if (teto >= valorMaximo) return teto;
  }
  return valorMaximo;
}

export default function GraficoLinhas({ dados }: { dados: PontoDaSerie[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);
  const [mostrarTabela, setMostrarTabela] = useState(false);

  const maximo = useMemo(
    () =>
      tetoLimpo(
        Math.max(1, ...dados.map((p) => Math.max(p.visualizacoes, p.cliques))),
      ),
    [dados],
  );

  const larguraUtil = LARGURA - PAD_ESQ - PAD_DIR;
  const x = (i: number) =>
    PAD_ESQ + (dados.length <= 1 ? 0 : (i / (dados.length - 1)) * larguraUtil);
  const y = (valor: number) => ALTURA_GRAFICO - (valor / maximo) * ALTURA_GRAFICO;

  const linha = (chave: "visualizacoes" | "cliques") =>
    dados.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p[chave])}`).join(" ");

  function moverPara(clientX: number) {
    const svg = svgRef.current;
    if (!svg || dados.length === 0) return;
    const retangulo = svg.getBoundingClientRect();
    const fracao = (clientX - retangulo.left) / retangulo.width;
    const posicaoSvg = fracao * LARGURA;
    const indice = Math.round(
      ((posicaoSvg - PAD_ESQ) / larguraUtil) * (dados.length - 1),
    );
    setIndiceAtivo(Math.min(dados.length - 1, Math.max(0, indice)));
  }

  const ativo = indiceAtivo !== null ? dados[indiceAtivo] : null;
  const ticksY = [0, 0.5, 1].map((f) => Math.round(maximo * f));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-white/70">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-3"
            style={{ background: COR_VISUALIZACOES }}
          />
          Visualizações
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3" style={{ background: COR_CLIQUES }} />
          Cliques
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LARGURA} ${ALTURA_TOTAL}`}
          className="w-full touch-none"
          role="img"
          aria-label="Visualizações e cliques por dia"
          tabIndex={0}
          onPointerMove={(e) => moverPara(e.clientX)}
          onPointerLeave={() => setIndiceAtivo(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              setIndiceAtivo((i) => Math.min(dados.length - 1, (i ?? -1) + 1));
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              setIndiceAtivo((i) => Math.max(0, (i ?? dados.length) - 1));
            }
          }}
        >
          {ticksY.map((valor) => (
            <g key={valor}>
              <line
                x1={PAD_ESQ}
                x2={LARGURA - PAD_DIR}
                y1={y(valor)}
                y2={y(valor)}
                stroke={COR_GRADE}
                strokeWidth={1}
              />
              <text
                x={PAD_ESQ - 8}
                y={y(valor)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fill={COR_TEXTO_MUTED}
              >
                {valor}
              </text>
            </g>
          ))}

          <line
            x1={PAD_ESQ}
            x2={LARGURA - PAD_DIR}
            y1={ALTURA_GRAFICO}
            y2={ALTURA_GRAFICO}
            stroke={COR_EIXO}
            strokeWidth={1}
          />

          <path d={linha("visualizacoes")} fill="none" stroke={COR_VISUALIZACOES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={linha("cliques")} fill="none" stroke={COR_CLIQUES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {dados.length > 0 && (
            <>
              <circle cx={x(dados.length - 1)} cy={y(dados[dados.length - 1].visualizacoes)} r={5} fill={COR_VISUALIZACOES} stroke={COR_SUPERFICIE} strokeWidth={2} />
              <circle cx={x(dados.length - 1)} cy={y(dados[dados.length - 1].cliques)} r={5} fill={COR_CLIQUES} stroke={COR_SUPERFICIE} strokeWidth={2} />
            </>
          )}

          {[0, Math.floor((dados.length - 1) / 2), dados.length - 1]
            .filter((i, idx, arr) => arr.indexOf(i) === idx && dados[i])
            .map((i) => (
              <text key={i} x={x(i)} y={ALTURA_GRAFICO + 20} textAnchor="middle" fontSize={11} fill={COR_TEXTO_MUTED}>
                {formatarDataCurta(dados[i].data)}
              </text>
            ))}

          {ativo && indiceAtivo !== null && (
            <line
              x1={x(indiceAtivo)}
              x2={x(indiceAtivo)}
              y1={0}
              y2={ALTURA_GRAFICO}
              stroke={COR_EIXO}
              strokeWidth={1}
            />
          )}
        </svg>

        {ativo && indiceAtivo !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded border border-white/15 bg-black px-2.5 py-1.5 text-xs"
            style={{
              left: `${(x(indiceAtivo) / LARGURA) * 100}%`,
            }}
          >
            <p className="mb-1 text-white/50">{formatarDataCurta(ativo.data)}</p>
            <p>
              <strong>{ativo.visualizacoes}</strong>{" "}
              <span className="text-white/50">visualizações</span>
            </p>
            <p>
              <strong>{ativo.cliques}</strong> <span className="text-white/50">cliques</span>
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMostrarTabela((v) => !v)}
        className="text-xs text-white/50 underline hover:text-white/80"
      >
        {mostrarTabela ? "Ocultar tabela" : "Ver como tabela"}
      </button>

      {mostrarTabela && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-white/50">
              <th className="py-1 pr-4 font-normal">Data</th>
              <th className="py-1 pr-4 font-normal">Visualizações</th>
              <th className="py-1 font-normal">Cliques</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((p) => (
              <tr key={p.data} className="border-t border-white/10">
                <td className="py-1 pr-4">{formatarDataCurta(p.data)}</td>
                <td className="py-1 pr-4 tabular-nums">{p.visualizacoes}</td>
                <td className="py-1 tabular-nums">{p.cliques}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
