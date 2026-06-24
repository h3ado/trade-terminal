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
      cot_market_history: {
        Row: {
          asset: string
          bias: string
          commercials: number
          created_at: string
          four_week_change: number
          id: string
          managed_money: number
          market: string
          non_reportable: number
          open_interest: number
          pct_rank: number
          raw: Json | null
          report_date: string
          ticker: string
          updated_at: string
          week_change: number
        }
        Insert: {
          asset: string
          bias?: string
          commercials?: number
          created_at?: string
          four_week_change?: number
          id?: string
          managed_money?: number
          market: string
          non_reportable?: number
          open_interest?: number
          pct_rank?: number
          raw?: Json | null
          report_date: string
          ticker: string
          updated_at?: string
          week_change?: number
        }
        Update: {
          asset?: string
          bias?: string
          commercials?: number
          created_at?: string
          four_week_change?: number
          id?: string
          managed_money?: number
          market?: string
          non_reportable?: number
          open_interest?: number
          pct_rank?: number
          raw?: Json | null
          report_date?: string
          ticker?: string
          updated_at?: string
          week_change?: number
        }
        Relationships: []
      }
      cot_report_history: {
        Row: {
          created_at: string
          id: string
          market: string
          report_date: string
          report_type: string
          row_data: Json
          ticker: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          market: string
          report_date: string
          report_type: string
          row_data: Json
          ticker?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          market?: string
          report_date?: string
          report_type?: string
          row_data?: Json
          ticker?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cot_snapshots: {
        Row: {
          cit_rows: number
          created_at: string
          disagg_rows: number
          id: string
          ingested_at: string
          legacy_rows: number
          market_rows: number
          report_date: string
          source: string
          tff_rows: number
          updated_at: string
        }
        Insert: {
          cit_rows?: number
          created_at?: string
          disagg_rows?: number
          id?: string
          ingested_at?: string
          legacy_rows?: number
          market_rows?: number
          report_date: string
          source?: string
          tff_rows?: number
          updated_at?: string
        }
        Update: {
          cit_rows?: number
          created_at?: string
          disagg_rows?: number
          id?: string
          ingested_at?: string
          legacy_rows?: number
          market_rows?: number
          report_date?: string
          source?: string
          tff_rows?: number
          updated_at?: string
        }
        Relationships: []
      }
      custom_companies: {
        Row: {
          created_at: string
          hq: string | null
          id: string
          is_deletion: boolean
          lat: number
          lng: number
          market_cap: number | null
          name: string
          notes: string | null
          override_id: string | null
          sector: string | null
          ticker: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hq?: string | null
          id?: string
          is_deletion?: boolean
          lat: number
          lng: number
          market_cap?: number | null
          name: string
          notes?: string | null
          override_id?: string | null
          sector?: string | null
          ticker?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hq?: string | null
          id?: string
          is_deletion?: boolean
          lat?: number
          lng?: number
          market_cap?: number | null
          name?: string
          notes?: string | null
          override_id?: string | null
          sector?: string | null
          ticker?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      econ_calendar_events: {
        Row: {
          actual: number | null
          country: string | null
          extra: Json
          fetched_at: string
          forecast: number | null
          id: string
          importance: number
          kind: string
          label: string
          prior: number | null
          source: string | null
          ticker: string | null
          ts: string
          unit: string | null
        }
        Insert: {
          actual?: number | null
          country?: string | null
          extra?: Json
          fetched_at?: string
          forecast?: number | null
          id?: string
          importance?: number
          kind: string
          label: string
          prior?: number | null
          source?: string | null
          ticker?: string | null
          ts: string
          unit?: string | null
        }
        Update: {
          actual?: number | null
          country?: string | null
          extra?: Json
          fetched_at?: string
          forecast?: number | null
          id?: string
          importance?: number
          kind?: string
          label?: string
          prior?: number | null
          source?: string | null
          ticker?: string | null
          ts?: string
          unit?: string | null
        }
        Relationships: []
      }
      news_audio_queue: {
        Row: {
          created_at: string
          domain: string | null
          headline_url: string
          id: string
          played: boolean
          tier: number
          title: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          headline_url: string
          id?: string
          played?: boolean
          tier?: number
          title: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          headline_url?: string
          id?: string
          played?: boolean
          tier?: number
          title?: string
        }
        Relationships: []
      }
      news_brief_log: {
        Row: {
          created_at: string
          id: number
          scope: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: never
          scope: string
          user_id: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: never
          scope?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      news_cb_doc_cache: {
        Row: {
          doc_url: string
          fetched_at: string
          id: string
          published_at: string
          source: string
          summary: Json
          title: string
        }
        Insert: {
          doc_url: string
          fetched_at?: string
          id?: string
          published_at: string
          source: string
          summary?: Json
          title: string
        }
        Update: {
          doc_url?: string
          fetched_at?: string
          id?: string
          published_at?: string
          source?: string
          summary?: Json
          title?: string
        }
        Relationships: []
      }
      news_contradiction_clusters: {
        Row: {
          created_at: string
          entity: string
          headline_urls: string[]
          id: string
          stance_variance: number
          summary: string | null
        }
        Insert: {
          created_at?: string
          entity: string
          headline_urls?: string[]
          id?: string
          stance_variance?: number
          summary?: string | null
        }
        Update: {
          created_at?: string
          entity?: string
          headline_urls?: string[]
          id?: string
          stance_variance?: number
          summary?: string | null
        }
        Relationships: []
      }
      news_daily_wrap: {
        Row: {
          generated_at: string
          summary: Json
          wrap_date: string
        }
        Insert: {
          generated_at?: string
          summary: Json
          wrap_date: string
        }
        Update: {
          generated_at?: string
          summary?: Json
          wrap_date?: string
        }
        Relationships: []
      }
      news_earnings_cache: {
        Row: {
          fetched_at: string
          id: string
          period: string
          source: string | null
          ticker: string
          transcript_summary: Json
          url: string | null
        }
        Insert: {
          fetched_at?: string
          id?: string
          period: string
          source?: string | null
          ticker: string
          transcript_summary: Json
          url?: string | null
        }
        Update: {
          fetched_at?: string
          id?: string
          period?: string
          source?: string | null
          ticker?: string
          transcript_summary?: Json
          url?: string | null
        }
        Relationships: []
      }
      news_geo_events: {
        Row: {
          country: string | null
          created_at: string
          event_type: string
          fatalities: number
          headline: string
          id: string
          lat: number
          lng: number
          occurred_at: string
          source: string | null
          url: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          event_type: string
          fatalities?: number
          headline: string
          id: string
          lat: number
          lng: number
          occurred_at: string
          source?: string | null
          url?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          event_type?: string
          fatalities?: number
          headline?: string
          id?: string
          lat?: number
          lng?: number
          occurred_at?: string
          source?: string | null
          url?: string | null
        }
        Relationships: []
      }
      news_qa_log: {
        Row: {
          answer: string
          created_at: string
          headline_url: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          headline_url: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          headline_url?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      news_saved_searches: {
        Row: {
          alert_enabled: boolean
          created_at: string
          filters: Json
          id: string
          last_seen_at: string | null
          name: string
          scope: string
          user_id: string
          value: string
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_seen_at?: string | null
          name: string
          scope: string
          user_id: string
          value?: string
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_seen_at?: string | null
          name?: string
          scope?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      news_thesis_cache: {
        Row: {
          generated_at: string
          payload: Json
          scope_key: string
        }
        Insert: {
          generated_at?: string
          payload: Json
          scope_key: string
        }
        Update: {
          generated_at?: string
          payload?: Json
          scope_key?: string
        }
        Relationships: []
      }
      news_x_cache: {
        Row: {
          cache_key: string
          fetched_at: string
          id: string
          payload: Json
        }
        Insert: {
          cache_key: string
          fetched_at?: string
          id?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          fetched_at?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      option_alert_rules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          name: string
          params: Json
          rule_type: string
          ticker: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          params?: Json
          rule_type: string
          ticker?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          params?: Json
          rule_type?: string
          ticker?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      option_strategy_templates: {
        Row: {
          created_at: string
          id: string
          legs: Json
          name: string
          stats: Json | null
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          legs: Json
          name: string
          stats?: Json | null
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          legs?: Json
          name?: string
          stats?: Json | null
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          score: number
          user_id: string
          week_start: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          score: number
          user_id: string
          week_start: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          score?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      quiz_cache: {
        Row: {
          generated_at: string
          payload: Json
          week_start: string
        }
        Insert: {
          generated_at?: string
          payload: Json
          week_start: string
        }
        Update: {
          generated_at?: string
          payload?: Json
          week_start?: string
        }
        Relationships: []
      }
      trade_news_links: {
        Row: {
          cluster_key: string
          created_at: string
          headline: string
          id: string
          source: string | null
          tone: number | null
          trade_id: string
          url: string
          user_id: string
        }
        Insert: {
          cluster_key: string
          created_at?: string
          headline: string
          id?: string
          source?: string | null
          tone?: number | null
          trade_id: string
          url: string
          user_id: string
        }
        Update: {
          cluster_key?: string
          created_at?: string
          headline?: string
          id?: string
          source?: string | null
          tone?: number | null
          trade_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_news_links_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          account_id: string
          created_at: string
          entry_date: string | null
          entry_price: number | null
          exit_date: string | null
          exit_price: number | null
          extra: Json | null
          fees: number | null
          id: string
          instrument_type: string | null
          mistakes: string[] | null
          notes: string | null
          pnl: number | null
          quantity: number
          rating: number | null
          screenshots: string[] | null
          setup: string | null
          side: string
          status: string | null
          stop_loss: number | null
          strategy: string | null
          symbol: string
          tags: string[] | null
          take_profit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          entry_date?: string | null
          entry_price?: number | null
          exit_date?: string | null
          exit_price?: number | null
          extra?: Json | null
          fees?: number | null
          id?: string
          instrument_type?: string | null
          mistakes?: string[] | null
          notes?: string | null
          pnl?: number | null
          quantity?: number
          rating?: number | null
          screenshots?: string[] | null
          setup?: string | null
          side: string
          status?: string | null
          stop_loss?: number | null
          strategy?: string | null
          symbol: string
          tags?: string[] | null
          take_profit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          entry_date?: string | null
          entry_price?: number | null
          exit_date?: string | null
          exit_price?: number | null
          extra?: Json | null
          fees?: number | null
          id?: string
          instrument_type?: string | null
          mistakes?: string[] | null
          notes?: string | null
          pnl?: number | null
          quantity?: number
          rating?: number | null
          screenshots?: string[] | null
          setup?: string | null
          side?: string
          status?: string | null
          stop_loss?: number | null
          strategy?: string | null
          symbol?: string
          tags?: string[] | null
          take_profit?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
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
