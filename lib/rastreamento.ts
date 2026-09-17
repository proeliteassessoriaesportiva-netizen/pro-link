import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

// hash(ip + user-agent + salt do dia) — nunca guardamos o IP bruto.
// O salt trocando por dia é suficiente pra estimar visitante único
// via count(distinct hash_visitante) sem manter um identificador
// estável por muito tempo (LGPD).
export async function hashVisitante(): Promise<string> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "desconhecido";
  const userAgent = hdrs.get("user-agent") ?? "desconhecido";
  const saltDiario = new Date().toISOString().slice(0, 10);

  return createHash("sha256")
    .update(`${ip}|${userAgent}|${saltDiario}`)
    .digest("hex");
}

export async function tipoDispositivo(): Promise<string> {
  const hdrs = await headers();
  const ua = (hdrs.get("user-agent") ?? "").toLowerCase();
  if (/tablet|ipad/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

export async function origemReferencia(): Promise<string> {
  const hdrs = await headers();
  const referer = hdrs.get("referer");
  if (!referer) return "direct";

  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("wa.me") || host.includes("whatsapp.com")) return "whatsapp";
    return host;
  } catch {
    return "direct";
  }
}
