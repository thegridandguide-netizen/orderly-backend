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
      albums: {
        Row: {
          city: string | null
          cover_image_url: string | null
          created_at: string
          featured: boolean
          id: string
          title: string
        }
        Insert: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          title: string
        }
        Update: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          featured?: boolean
          id?: string
          title?: string
        }
        Relationships: []
      }
      booking_items: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          image_snapshot: string | null
          line_total: number
          meta: Json
          quantity: number
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          title_snapshot: string
          unit_price: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          image_snapshot?: string | null
          line_total: number
          meta?: Json
          quantity?: number
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          title_snapshot: string
          unit_price: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          image_snapshot?: string | null
          line_total?: number
          meta?: Json
          quantity?: number
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_kind"]
          title_snapshot?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_paid: number
          contact_phone: string | null
          created_at: string
          currency: string
          deposit_amount: number
          discount_total: number
          event_date: string | null
          fee_total: number
          guest_count: number | null
          id: string
          notes: string | null
          payment_method: string | null
          payment_type: string
          pricing_breakdown: Json
          receipt_number: string
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          tax_total: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          contact_phone?: string | null
          created_at?: string
          currency?: string
          deposit_amount?: number
          discount_total?: number
          event_date?: string | null
          fee_total?: number
          guest_count?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_type?: string
          pricing_breakdown?: Json
          receipt_number: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          tax_total?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          contact_phone?: string | null
          created_at?: string
          currency?: string
          deposit_amount?: number
          discount_total?: number
          event_date?: string | null
          fee_total?: number
          guest_count?: number | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_type?: string
          pricing_breakdown?: Json
          receipt_number?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          tax_total?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          meta: Json
          quantity: number
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json
          quantity?: number
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          quantity?: number
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_kind"]
          user_id?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string | null
          event_date: string | null
          guest_count: number | null
          id: string
          message: string | null
          name: string | null
          phone: string | null
          status: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_date?: string | null
          guest_count?: number | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_date?: string | null
          guest_count?: number | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          status?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          amount: number | null
          booking_id: string
          created_at: string
          id: string
          image_url: string | null
          notes: string | null
          reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          booking_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          booking_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          album_id: string | null
          category: string | null
          city: string | null
          created_at: string
          id: string
          image_url: string
          title: string | null
        }
        Insert: {
          album_id?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          image_url: string
          title?: string | null
        }
        Update: {
          album_id?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          image_url?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string | null
          id: string
          name: string
          notes: string | null
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          scope: Database["public"]["Enums"]["pricing_rule_scope"]
          starts_at: string | null
          updated_at: string
          value: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          notes?: string | null
          rule_type: Database["public"]["Enums"]["pricing_rule_type"]
          scope?: Database["public"]["Enums"]["pricing_rule_scope"]
          starts_at?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          rule_type?: Database["public"]["Enums"]["pricing_rule_type"]
          scope?: Database["public"]["Enums"]["pricing_rule_scope"]
          starts_at?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_kind"]
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          gateway: string
          id: string
          raw: Json
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          gateway?: string
          id?: string
          raw?: Json
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          gateway?: string
          id?: string
          raw?: Json
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_listings: {
        Row: {
          badge: string | null
          category: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          gallery_image_urls: string[] | null
          id: string
          is_active: boolean
          price_from: number | null
          price_to: number | null
          rating_avg: number
          rating_count: number
          title: string
          updated_at: string
          vendor_profile_id: string | null
        }
        Insert: {
          badge?: string | null
          category?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery_image_urls?: string[] | null
          id?: string
          is_active?: boolean
          price_from?: number | null
          price_to?: number | null
          rating_avg?: number
          rating_count?: number
          title: string
          updated_at?: string
          vendor_profile_id?: string | null
        }
        Update: {
          badge?: string | null
          category?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery_image_urls?: string[] | null
          id?: string
          is_active?: boolean
          price_from?: number | null
          price_to?: number | null
          rating_avg?: number
          rating_count?: number
          title?: string
          updated_at?: string
          vendor_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_listings_vendor_profile_id_fkey"
            columns: ["vendor_profile_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          bio: string | null
          business_name: string
          categories: string[] | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          phone: string | null
          price_from: number | null
          price_to: number | null
          service_areas: string[] | null
          updated_at: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          bio?: string | null
          business_name: string
          categories?: string[] | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          price_from?: number | null
          price_to?: number | null
          service_areas?: string[] | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          bio?: string | null
          business_name?: string
          categories?: string[] | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          price_from?: number | null
          price_to?: number | null
          service_areas?: string[] | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          amenities: string[] | null
          area: string | null
          capacity_max: number | null
          capacity_min: number | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          gallery_image_urls: string[] | null
          handpicked: boolean
          id: string
          is_active: boolean
          name: string
          non_veg_price: number | null
          rating_avg: number
          rating_count: number
          rental_price: number | null
          rooms: number | null
          tags: string[] | null
          updated_at: string
          veg_price: number | null
          venue_type: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          capacity_max?: number | null
          capacity_min?: number | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery_image_urls?: string[] | null
          handpicked?: boolean
          id?: string
          is_active?: boolean
          name: string
          non_veg_price?: number | null
          rating_avg?: number
          rating_count?: number
          rental_price?: number | null
          rooms?: number | null
          tags?: string[] | null
          updated_at?: string
          veg_price?: number | null
          venue_type?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          capacity_max?: number | null
          capacity_min?: number | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gallery_image_urls?: string[] | null
          handpicked?: boolean
          id?: string
          is_active?: boolean
          name?: string
          non_veg_price?: number | null
          rating_avg?: number
          rating_count?: number
          rental_price?: number | null
          rooms?: number | null
          tags?: string[] | null
          updated_at?: string
          veg_price?: number | null
          venue_type?: string | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["target_kind"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_kind"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendor" | "customer"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "refunded"
      pricing_rule_scope: "all" | "venue" | "vendor"
      pricing_rule_type:
        | "discount_percent"
        | "discount_flat"
        | "tax_percent"
        | "fee_flat"
        | "fee_percent"
      target_kind: "venue" | "vendor"
      transaction_status: "initiated" | "success" | "failed" | "refunded"
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
    Enums: {
      app_role: ["admin", "vendor", "customer"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "refunded",
      ],
      pricing_rule_scope: ["all", "venue", "vendor"],
      pricing_rule_type: [
        "discount_percent",
        "discount_flat",
        "tax_percent",
        "fee_flat",
        "fee_percent",
      ],
      target_kind: ["venue", "vendor"],
      transaction_status: ["initiated", "success", "failed", "refunded"],
    },
  },
} as const
