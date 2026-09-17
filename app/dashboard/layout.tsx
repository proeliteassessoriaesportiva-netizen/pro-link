import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/dados";
import { sair } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioAtual();

  if (!usuario) {
    redirect("/login");
  }

  if (usuario.status === "convidado") {
    redirect("/convite/completar");
  }

  if (usuario.status === "suspenso") {
    redirect("/login?erro=Sua+conta+está+suspensa");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <nav className="flex items-center gap-4 text-sm">
          <span className="font-semibold">Pro Link</span>
          <Link href="/dashboard" className="text-white/70 hover:text-white">
            Visão geral
          </Link>
          <Link href="/dashboard/perfil" className="text-white/70 hover:text-white">
            Perfil
          </Link>
          <Link href="/dashboard/links" className="text-white/70 hover:text-white">
            Links
          </Link>
          {usuario.papel === "admin" && (
            <Link href="/dashboard/equipe" className="text-white/70 hover:text-white">
              Equipe
            </Link>
          )}
        </nav>

        <form action={sair}>
          <button type="submit" className="text-sm text-white/70 hover:text-white">
            Sair
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
