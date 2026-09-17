import type { Database } from "@/types/database";

export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
export type Perfil = Database["public"]["Tables"]["perfis"]["Row"];
export type Link = Database["public"]["Tables"]["links"]["Row"];
export type Tema = Database["public"]["Tables"]["temas"]["Row"];
export type Organizacao = Database["public"]["Tables"]["organizacoes"]["Row"];
