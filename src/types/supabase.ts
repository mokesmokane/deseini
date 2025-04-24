export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          name: string
          project_id: string | null
          size: number
          type: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          name: string
          project_id?: string | null
          size: number
          type: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          name?: string
          project_id?: string | null
          size?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      charts: {
        Row: {
          chart_data: Json
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chart_data: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chart_data?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          created_at: string | null
          deadline: string
          deliverable_name: string
          description: string | null
          fee: number | null
          id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          deadline: string
          deliverable_name: string
          description?: string | null
          fee?: number | null
          id?: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string
          deliverable_name?: string
          description?: string | null
          fee?: number | null
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_charts: {
        Row: {
          chart_id: string
          created_at: string
          project_id: string
        }
        Insert: {
          chart_id: string
          created_at?: string
          project_id: string
        }
        Update: {
          chart_id?: string
          created_at?: string
          project_id?: string
        }
        Relationships: []
      }
      project_draft_chart: {
        Row: {
          json: Json
          project_id: string
          updated_at: string
        }
        Insert: {
          json: Json
          project_id?: string
          updated_at?: string
        }
        Update: {
          json?: Json
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_draft_chart_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_markdown: {
        Row: {
          content: string
          project_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          project_id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_markdown_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          banner_image: string | null
          created_at: string | null
          description: string | null
          id: string
          project_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          banner_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          banner_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          country: string
          created_at: string | null
          description: string | null
          end_date: string
          hourly_rate: number
          id: string
          level: string
          payment_by: string
          professions: string
          project_id: string
          region: string
          start_date: string
          title: string
          town: string
          type: string
        }
        Insert: {
          country: string
          created_at?: string | null
          description?: string | null
          end_date: string
          hourly_rate: number
          id?: string
          level: string
          payment_by: string
          professions: string
          project_id: string
          region: string
          start_date: string
          title: string
          town: string
          type: string
        }
        Update: {
          country?: string
          created_at?: string | null
          description?: string | null
          end_date?: string
          hourly_rate?: number
          id?: string
          level?: string
          payment_by?: string
          professions?: string
          project_id?: string
          region?: string
          start_date?: string
          title?: string
          town?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_projects: {
        Row: {
          project_id: string
          starred: boolean
          user_id: string
        }
        Insert: {
          project_id?: string
          starred?: boolean
          user_id?: string
        }
        Update: {
          project_id?: string
          starred?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
