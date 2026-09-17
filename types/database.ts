export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cliques_link: {
        Row: {
          id: string
          link_id: string
          ocorrido_em: string
          perfil_id: string
          sessao_id: string | null
          tipo_dispositivo: string | null
        }
        Insert: {
          id?: string
          link_id: string
          ocorrido_em?: string
          perfil_id: string
          sessao_id?: string | null
          tipo_dispositivo?: string | null
        }
        Update: {
          id?: string
          link_id?: string
          ocorrido_em?: string
          perfil_id?: string
          sessao_id?: string | null
          tipo_dispositivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliques_link_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliques_link_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliques_link_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      dominios_redirecionamento_permitidos: {
        Row: {
          criado_em: string
          dominio: string
          id: string
          organizacao_id: string
          permite_subdominio_curinga: boolean
        }
        Insert: {
          criado_em?: string
          dominio: string
          id?: string
          organizacao_id: string
          permite_subdominio_curinga?: boolean
        }
        Update: {
          criado_em?: string
          dominio?: string
          id?: string
          organizacao_id?: string
          permite_subdominio_curinga?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dominios_redirecionamento_permitidos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string | null
          dominio_aprovado: boolean
          dominio_destino: string
          esta_ativo: boolean
          icone: string | null
          id: string
          perfil_id: string
          posicao: number
          slug: string
          titulo: string
          url_destino: string
          url_imagem: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          dominio_aprovado?: boolean
          dominio_destino: string
          esta_ativo?: boolean
          icone?: string | null
          id?: string
          perfil_id: string
          posicao?: number
          slug: string
          titulo: string
          url_destino: string
          url_imagem?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          dominio_aprovado?: boolean
          dominio_destino?: string
          esta_ativo?: boolean
          icone?: string | null
          id?: string
          perfil_id?: string
          posicao?: number
          slug?: string
          titulo?: string
          url_destino?: string
          url_imagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes: {
        Row: {
          criado_em: string
          dominio_principal: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          criado_em?: string
          dominio_principal: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          criado_em?: string
          dominio_principal?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      perfis: {
        Row: {
          atualizado_em: string
          biografia: string | null
          cargo: string | null
          criado_em: string
          esta_ativo: boolean
          id: string
          nome_exibicao: string
          organizacao_id: string
          seo_descricao: string | null
          seo_titulo: string | null
          slug: string
          tema_id: string | null
          url_avatar: string | null
          url_imagem_og: string | null
          url_instagram: string | null
          url_whatsapp: string | null
          url_youtube: string | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          biografia?: string | null
          cargo?: string | null
          criado_em?: string
          esta_ativo?: boolean
          id?: string
          nome_exibicao: string
          organizacao_id: string
          seo_descricao?: string | null
          seo_titulo?: string | null
          slug: string
          tema_id?: string | null
          url_avatar?: string | null
          url_imagem_og?: string | null
          url_instagram?: string | null
          url_whatsapp?: string | null
          url_youtube?: string | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          biografia?: string | null
          cargo?: string | null
          criado_em?: string
          esta_ativo?: boolean
          id?: string
          nome_exibicao?: string
          organizacao_id?: string
          seo_descricao?: string | null
          seo_titulo?: string | null
          slug?: string
          tema_id?: string | null
          url_avatar?: string | null
          url_imagem_og?: string | null
          url_instagram?: string | null
          url_whatsapp?: string | null
          url_youtube?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      permissoes_template_perfil: {
        Row: {
          concedido_em: string
          concedido_por: string | null
          perfil_id: string
          tema_id: string
        }
        Insert: {
          concedido_em?: string
          concedido_por?: string | null
          perfil_id: string
          tema_id: string
        }
        Update: {
          concedido_em?: string
          concedido_por?: string | null
          perfil_id?: string
          tema_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissoes_template_perfil_concedido_por_fkey"
            columns: ["concedido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissoes_template_perfil_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissoes_template_perfil_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes: {
        Row: {
          hash_visitante: string
          id: string
          origem_referencia: string | null
          perfil_id: string
          primeiro_acesso_em: string
          ultimo_acesso_em: string
        }
        Insert: {
          hash_visitante: string
          id?: string
          origem_referencia?: string | null
          perfil_id: string
          primeiro_acesso_em?: string
          ultimo_acesso_em?: string
        }
        Update: {
          hash_visitante?: string
          id?: string
          origem_referencia?: string | null
          perfil_id?: string
          primeiro_acesso_em?: string
          ultimo_acesso_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      slugs_reservados: {
        Row: {
          motivo: string | null
          slug: string
        }
        Insert: {
          motivo?: string | null
          slug: string
        }
        Update: {
          motivo?: string | null
          slug?: string
        }
        Relationships: []
      }
      temas: {
        Row: {
          configuracao: Json
          esta_ativo: boolean
          id: string
          nome: string
          slug: string
        }
        Insert: {
          configuracao?: Json
          esta_ativo?: boolean
          id?: string
          nome: string
          slug: string
        }
        Update: {
          configuracao?: Json
          esta_ativo?: boolean
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativado_em: string | null
          convidado_em: string
          convidado_por: string | null
          criado_em: string
          email: string
          id: string
          organizacao_id: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          status: Database["public"]["Enums"]["status_usuario"]
        }
        Insert: {
          ativado_em?: string | null
          convidado_em?: string
          convidado_por?: string | null
          criado_em?: string
          email: string
          id?: string
          organizacao_id: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          status?: Database["public"]["Enums"]["status_usuario"]
        }
        Update: {
          ativado_em?: string | null
          convidado_em?: string
          convidado_por?: string | null
          criado_em?: string
          email?: string
          id?: string
          organizacao_id?: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          status?: Database["public"]["Enums"]["status_usuario"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      visualizacoes_pagina: {
        Row: {
          id: string
          ocorrido_em: string
          origem_referencia: string | null
          perfil_id: string
          sessao_id: string | null
          tipo_dispositivo: string | null
        }
        Insert: {
          id?: string
          ocorrido_em?: string
          origem_referencia?: string | null
          perfil_id: string
          sessao_id?: string | null
          tipo_dispositivo?: string | null
        }
        Update: {
          id?: string
          ocorrido_em?: string
          origem_referencia?: string | null
          perfil_id?: string
          sessao_id?: string | null
          tipo_dispositivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visualizacoes_pagina_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visualizacoes_pagina_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      papel_usuario: "admin" | "membro"
      status_usuario: "convidado" | "ativo" | "suspenso"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      papel_usuario: ["admin", "membro"],
      status_usuario: ["convidado", "ativo", "suspenso"],
    },
  },
} as const
