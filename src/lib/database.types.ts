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
      jobs: {
        Row: {
          id: string
          title: string
          rubro_id: string
          ciudad_id: string
          barrio: string | null
          description: string
          budget_min: number | null
          budget_max: number | null
          photos: string[]
          status: string
          author_name: string
          author_phone: string
          client_token: string
          accepted_quote_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          rubro_id: string
          ciudad_id: string
          barrio?: string | null
          description: string
          budget_min?: number | null
          budget_max?: number | null
          photos?: string[]
          status?: string
          author_name: string
          author_phone: string
          client_token?: string
          accepted_quote_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          rubro_id?: string
          ciudad_id?: string
          barrio?: string | null
          description?: string
          budget_min?: number | null
          budget_max?: number | null
          photos?: string[]
          status?: string
          author_name?: string
          author_phone?: string
          client_token?: string
          accepted_quote_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          id: string
          job_id: string
          provider_id: string
          amount: number
          message: string
          estimated_days: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          provider_id: string
          amount: number
          message?: string
          estimated_days?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          provider_id?: string
          amount?: number
          message?: string
          estimated_days?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          id: string
          provider_id: string
          type: string
          file_name: string
          file_path: string | null
          status: string
          points: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          type: string
          file_name: string
          file_path?: string | null
          status?: string
          points?: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          type?: string
          file_name?: string
          file_path?: string | null
          status?: string
          points?: number
          uploaded_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          provider_id: string
          author_name: string
          rating: number
          comment: string
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          author_name: string
          rating: number
          comment?: string
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          author_name?: string
          rating?: number
          comment?: string
          created_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          id: string
          label: string
          lat: number
          lng: number
          phone_prefix: string
        }
        Insert: {
          id: string
          label: string
          lat: number
          lng: number
          phone_prefix: string
        }
        Update: {
          id?: string
          label?: string
          lat?: number
          lng?: number
          phone_prefix?: string
        }
        Relationships: []
      }
      emergency_requests: {
        Row: {
          ciudad_id: string
          client_phone: string
          created_at: string
          current_index: number
          id: string
          matched_provider_id: string | null
          mp_external_reference: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          n8n_resume_url: string | null
          provider_queue: string[]
          rubro_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ciudad_id: string
          client_phone: string
          created_at?: string
          current_index?: number
          id?: string
          matched_provider_id?: string | null
          mp_external_reference?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          n8n_resume_url?: string | null
          provider_queue?: string[]
          rubro_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ciudad_id?: string
          client_phone?: string
          created_at?: string
          current_index?: number
          id?: string
          matched_provider_id?: string | null
          mp_external_reference?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          n8n_resume_url?: string | null
          provider_queue?: string[]
          rubro_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_requests_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_matched_provider_id_fkey"
            columns: ["matched_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_requests_rubro_id_fkey"
            columns: ["rubro_id"]
            isOneToOne: false
            referencedRelation: "rubros"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          auth_user_id: string | null
          barrio: string | null
          bio: string | null
          ciudad_id: string
          created_at: string
          id: string
          is_emergency_available: boolean
          is_verified: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string
          photos: string[]
          rating: number
          rubro_id: string
          status: string
          subscription_tier_id: string | null
          total_jobs: number
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          auth_user_id?: string | null
          barrio?: string | null
          bio?: string | null
          ciudad_id: string
          created_at?: string
          id?: string
          is_emergency_available?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          phone: string
          photos?: string[]
          rating?: number
          rubro_id: string
          status?: string
          subscription_tier_id?: string | null
          total_jobs?: number
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          auth_user_id?: string | null
          barrio?: string | null
          bio?: string | null
          ciudad_id?: string
          created_at?: string
          id?: string
          is_emergency_available?: boolean
          is_verified?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string
          photos?: string[]
          rating?: number
          rubro_id?: string
          status?: string
          subscription_tier_id?: string | null
          total_jobs?: number
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_rubro_id_fkey"
            columns: ["rubro_id"]
            isOneToOne: false
            referencedRelation: "rubros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "providers_subscription_tier_id_fkey"
            columns: ["subscription_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      rubros: {
        Row: {
          icon: string
          id: string
          label: string
        }
        Insert: {
          icon: string
          id: string
          label: string
        }
        Update: {
          icon?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      subscription_tiers: {
        Row: {
          contacts_per_month: number | null
          has_badge: boolean
          id: string
          label: string
          price_ars: number
          priority: string
        }
        Insert: {
          contacts_per_month?: number | null
          has_badge?: boolean
          id: string
          label: string
          price_ars: number
          priority?: string
        }
        Update: {
          contacts_per_month?: number | null
          has_badge?: boolean
          id?: string
          label?: string
          price_ars?: number
          priority?: string
        }
        Relationships: []
      }
    }
    Views: {
      open_jobs: {
        Row: {
          id: string
          title: string
          rubro_id: string
          ciudad_id: string
          barrio: string | null
          description: string
          budget_min: number | null
          budget_max: number | null
          photos: string[]
          status: string
          author_name: string
          created_at: string
          quote_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      post_job: {
        Args: {
          p_title: string
          p_rubro: string
          p_ciudad: string
          p_description: string
          p_author_name: string
          p_author_phone: string
          p_budget_max?: number | null
          p_barrio?: string | null
        }
        Returns: Json
      }
      get_job_by_token: {
        Args: { p_token: string }
        Returns: Json
      }
      accept_quote_by_token: {
        Args: { p_token: string; p_quote_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// =============================================================================
// Convenience row types
// =============================================================================

export type DbCity                = Tables<'cities'>
export type DbRubro               = Tables<'rubros'>
export type DbSubscriptionTier    = Tables<'subscription_tiers'>
export type DbProvider            = Tables<'providers'>
export type DbProviderInsert      = TablesInsert<'providers'>
export type DbProviderUpdate      = TablesUpdate<'providers'>
export type DbEmergencyRequest    = Tables<'emergency_requests'>
export type DbEmergencyRequestInsert = TablesInsert<'emergency_requests'>

export type ProviderStatus            = 'active' | 'inactive' | 'pending'
export type EmergencyRequestStatus    = 'searching' | 'matched' | 'payment_pending' | 'completed' | 'failed'
export type SubscriptionTierPriority  = 'normal' | 'alta' | 'maxima'
