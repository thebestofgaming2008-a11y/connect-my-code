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
      activity_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string | null
          full_name: string
          phone: string
          address_line_1: string
          address_line_2: string | null
          landmark: string | null
          city: string
          state: string
          postal_code: string
          country: string
          country_code: string | null
          is_default: boolean | null
          is_billing_address: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          label?: string | null
          full_name: string
          phone: string
          address_line_1: string
          address_line_2?: string | null
          landmark?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          country_code?: string | null
          is_default?: boolean | null
          is_billing_address?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          label?: string | null
          full_name?: string
          phone?: string
          address_line_1?: string
          address_line_2?: string | null
          landmark?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          country_code?: string | null
          is_default?: boolean | null
          is_billing_address?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image_url: string
          image_url_mobile: string | null
          link_url: string | null
          button_text: string | null
          position: string | null
          sort_order: number | null
          starts_at: string | null
          ends_at: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          image_url: string
          image_url_mobile?: string | null
          link_url?: string | null
          button_text?: string | null
          position?: string | null
          sort_order?: number | null
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          image_url?: string
          image_url_mobile?: string | null
          link_url?: string | null
          button_text?: string | null
          position?: string | null
          sort_order?: number | null
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          product_id: string
          variant_id: string | null
          quantity: number | null
          saved_for_later: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          product_id: string
          variant_id?: string | null
          quantity?: number | null
          saved_for_later?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          product_id?: string
          variant_id?: string | null
          quantity?: number | null
          saved_for_later?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          icon: string | null
          parent_id: string | null
          level: number | null
          path: string | null
          sort_order: number | null
          is_active: boolean | null
          is_featured: boolean | null
          products_count: number | null
          meta_title: string | null
          meta_description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          icon?: string | null
          parent_id?: string | null
          level?: number | null
          path?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          products_count?: number | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          icon?: string | null
          parent_id?: string | null
          level?: number | null
          path?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          products_count?: number | null
          meta_title?: string | null
          meta_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          id: string
          coupon_id: string
          user_id: string | null
          order_id: string | null
          discount_applied: number
          created_at: string | null
        }
        Insert: {
          id?: string
          coupon_id: string
          user_id?: string | null
          order_id?: string | null
          discount_applied: number
          created_at?: string | null
        }
        Update: {
          id?: string
          coupon_id?: string
          user_id?: string | null
          order_id?: string | null
          discount_applied?: number
          created_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          max_discount_inr: number | null
          max_discount_usd: number | null
          minimum_order_inr: number | null
          minimum_order_usd: number | null
          applicable_products: string[] | null
          applicable_categories: string[] | null
          excluded_products: string[] | null
          max_uses: number | null
          max_uses_per_user: number | null
          current_uses: number | null
          valid_from: string | null
          valid_until: string | null
          is_active: boolean | null
          is_first_order_only: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          max_discount_inr?: number | null
          max_discount_usd?: number | null
          minimum_order_inr?: number | null
          minimum_order_usd?: number | null
          applicable_products?: string[] | null
          applicable_categories?: string[] | null
          excluded_products?: string[] | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          current_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
          is_active?: boolean | null
          is_first_order_only?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          max_discount_inr?: number | null
          max_discount_usd?: number | null
          minimum_order_inr?: number | null
          minimum_order_usd?: number | null
          applicable_products?: string[] | null
          applicable_categories?: string[] | null
          excluded_products?: string[] | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          current_uses?: number | null
          valid_from?: string | null
          valid_until?: string | null
          is_active?: boolean | null
          is_first_order_only?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          id: string
          base_currency: string
          rates: Json
          source: string | null
          fetched_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          base_currency?: string
          rates: Json
          source?: string | null
          fetched_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          base_currency?: string
          rates?: Json
          source?: string | null
          fetched_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          data: Json | null
          is_read: boolean | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          data?: Json | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          data?: Json | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          product_author: string | null
          product_image: string | null
          product_sku: string | null
          variant_name: string | null
          quantity: number
          unit_price: number
          total_price: number
          currency: string
          is_reviewed: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name: string
          product_author?: string | null
          product_image?: string | null
          product_sku?: string | null
          variant_name?: string | null
          quantity: number
          unit_price: number
          total_price: number
          currency: string
          is_reviewed?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          product_name?: string
          product_author?: string | null
          product_image?: string | null
          product_sku?: string | null
          variant_name?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          currency?: string
          is_reviewed?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
          previous_status: Database["public"]["Enums"]["order_status"] | null
          note: string | null
          is_customer_visible: boolean | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
          previous_status?: Database["public"]["Enums"]["order_status"] | null
          note?: string | null
          is_customer_visible?: boolean | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          previous_status?: Database["public"]["Enums"]["order_status"] | null
          note?: string | null
          is_customer_visible?: boolean | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          payment_method: string | null
          payment_provider: string | null
          payment_id: string | null
          payment_order_id: string | null
          payment_signature: string | null
          currency: string
          exchange_rate: number | null
          subtotal: number
          discount: number | null
          shipping_cost: number | null
          tax: number | null
          total: number
          total_in_usd: number | null
          coupon_id: string | null
          coupon_code: string | null
          coupon_discount: number | null
          shipping_name: string
          shipping_email: string
          shipping_phone: string
          shipping_address_line_1: string
          shipping_address_line_2: string | null
          shipping_city: string
          shipping_state: string
          shipping_postal_code: string
          shipping_country: string
          shipping_country_code: string | null
          billing_same_as_shipping: boolean | null
          billing_name: string | null
          billing_address_line_1: string | null
          billing_city: string | null
          billing_state: string | null
          billing_postal_code: string | null
          billing_country: string | null
          shipping_method: string | null
          shipping_zone_id: string | null
          tracking_number: string | null
          tracking_carrier: string | null
          tracking_url: string | null
          estimated_delivery_min: string | null
          estimated_delivery_max: string | null
          customer_notes: string | null
          admin_notes: string | null
          internal_notes: string | null
          gift_message: string | null
          is_gift: boolean | null
          ip_address: string | null
          user_agent: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          paid_at: string | null
          confirmed_at: string | null
          processing_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
          refunded_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_number?: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_id?: string | null
          payment_order_id?: string | null
          payment_signature?: string | null
          currency?: string
          exchange_rate?: number | null
          subtotal: number
          discount?: number | null
          shipping_cost?: number | null
          tax?: number | null
          total: number
          total_in_usd?: number | null
          coupon_id?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          shipping_name: string
          shipping_email: string
          shipping_phone: string
          shipping_address_line_1: string
          shipping_address_line_2?: string | null
          shipping_city: string
          shipping_state: string
          shipping_postal_code: string
          shipping_country?: string
          shipping_country_code?: string | null
          billing_same_as_shipping?: boolean | null
          billing_name?: string | null
          billing_address_line_1?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          shipping_method?: string | null
          shipping_zone_id?: string | null
          tracking_number?: string | null
          tracking_carrier?: string | null
          tracking_url?: string | null
          estimated_delivery_min?: string | null
          estimated_delivery_max?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          internal_notes?: string | null
          gift_message?: string | null
          is_gift?: boolean | null
          ip_address?: string | null
          user_agent?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          paid_at?: string | null
          confirmed_at?: string | null
          processing_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_id?: string | null
          payment_order_id?: string | null
          payment_signature?: string | null
          currency?: string
          exchange_rate?: number | null
          subtotal?: number
          discount?: number | null
          shipping_cost?: number | null
          tax?: number | null
          total?: number
          total_in_usd?: number | null
          coupon_id?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          shipping_name?: string
          shipping_email?: string
          shipping_phone?: string
          shipping_address_line_1?: string
          shipping_address_line_2?: string | null
          shipping_city?: string
          shipping_state?: string
          shipping_postal_code?: string
          shipping_country?: string
          shipping_country_code?: string | null
          billing_same_as_shipping?: boolean | null
          billing_name?: string | null
          billing_address_line_1?: string | null
          billing_city?: string | null
          billing_state?: string | null
          billing_postal_code?: string | null
          billing_country?: string | null
          shipping_method?: string | null
          shipping_zone_id?: string | null
          tracking_number?: string | null
          tracking_carrier?: string | null
          tracking_url?: string | null
          estimated_delivery_min?: string | null
          estimated_delivery_max?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          internal_notes?: string | null
          gift_message?: string | null
          is_gift?: boolean | null
          ip_address?: string | null
          user_agent?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          paid_at?: string | null
          confirmed_at?: string | null
          processing_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
          refunded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          meta_title: string | null
          meta_description: string | null
          is_published: boolean | null
          published_at: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: string | null
          meta_title?: string | null
          meta_description?: string | null
          is_published?: boolean | null
          published_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string | null
          meta_title?: string | null
          meta_description?: string | null
          is_published?: boolean | null
          published_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          price: number | null
          price_inr: number | null
          stock_quantity: number | null
          image_url: string | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sku?: string | null
          price?: number | null
          price_inr?: number | null
          stock_quantity?: number | null
          image_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string | null
          price?: number | null
          price_inr?: number | null
          stock_quantity?: number | null
          image_url?: string | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          short_description: string | null
          description: string | null
          author: string | null
          publisher: string | null
          language: string | null
          pages: number | null
          isbn: string | null
          isbn_13: string | null
          binding: string | null
          edition: string | null
          publication_date: string | null
          price: number
          price_inr: number
          sale_price: number | null
          sale_price_inr: number | null
          cost_price: number | null
          cost_price_inr: number | null
          sku: string | null
          barcode: string | null
          stock_quantity: number | null
          low_stock_threshold: number | null
          weight_grams: number | null
          dimensions_cm: string | null
          category: string | null
          category_id: string | null
          tags: string[] | null
          cover_image_url: string | null
          images: string[] | null
          preview_pdf_url: string | null
          video_url: string | null
          badge: string | null
          ribbon_text: string | null
          rating: number | null
          reviews_count: number | null
          in_stock: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          is_new_arrival: boolean | null
          is_bestseller: boolean | null
          is_on_sale: boolean | null
          is_digital: boolean | null
          is_preorder: boolean | null
          preorder_date: string | null
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          views_count: number | null
          sales_count: number | null
          wishlist_count: number | null
          created_at: string | null
          updated_at: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          short_description?: string | null
          description?: string | null
          author?: string | null
          publisher?: string | null
          language?: string | null
          pages?: number | null
          isbn?: string | null
          isbn_13?: string | null
          binding?: string | null
          edition?: string | null
          publication_date?: string | null
          price: number
          price_inr: number
          sale_price?: number | null
          sale_price_inr?: number | null
          cost_price?: number | null
          cost_price_inr?: number | null
          sku?: string | null
          barcode?: string | null
          stock_quantity?: number | null
          low_stock_threshold?: number | null
          weight_grams?: number | null
          dimensions_cm?: string | null
          category?: string | null
          category_id?: string | null
          tags?: string[] | null
          cover_image_url?: string | null
          images?: string[] | null
          preview_pdf_url?: string | null
          video_url?: string | null
          badge?: string | null
          ribbon_text?: string | null
          rating?: number | null
          reviews_count?: number | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_bestseller?: boolean | null
          is_on_sale?: boolean | null
          is_digital?: boolean | null
          is_preorder?: boolean | null
          preorder_date?: string | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          views_count?: number | null
          sales_count?: number | null
          wishlist_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          short_description?: string | null
          description?: string | null
          author?: string | null
          publisher?: string | null
          language?: string | null
          pages?: number | null
          isbn?: string | null
          isbn_13?: string | null
          binding?: string | null
          edition?: string | null
          publication_date?: string | null
          price?: number
          price_inr?: number
          sale_price?: number | null
          sale_price_inr?: number | null
          cost_price?: number | null
          cost_price_inr?: number | null
          sku?: string | null
          barcode?: string | null
          stock_quantity?: number | null
          low_stock_threshold?: number | null
          weight_grams?: number | null
          dimensions_cm?: string | null
          category?: string | null
          category_id?: string | null
          tags?: string[] | null
          cover_image_url?: string | null
          images?: string[] | null
          preview_pdf_url?: string | null
          video_url?: string | null
          badge?: string | null
          ribbon_text?: string | null
          rating?: number | null
          reviews_count?: number | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new_arrival?: boolean | null
          is_bestseller?: boolean | null
          is_on_sale?: boolean | null
          is_digital?: boolean | null
          is_preorder?: boolean | null
          preorder_date?: string | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          views_count?: number | null
          sales_count?: number | null
          wishlist_count?: number | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: string | null
          preferred_language: string | null
          preferred_currency: string | null
          marketing_consent: boolean | null
          last_login_at: string | null
          login_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          preferred_language?: string | null
          preferred_currency?: string | null
          marketing_consent?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          preferred_language?: string | null
          preferred_currency?: string | null
          marketing_consent?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          product_id: string
          order_id: string | null
          order_item_id: string | null
          rating: number
          title: string | null
          content: string | null
          pros: string[] | null
          cons: string[] | null
          images: string[] | null
          is_verified_purchase: boolean | null
          is_approved: boolean | null
          is_featured: boolean | null
          helpful_count: number | null
          not_helpful_count: number | null
          admin_response: string | null
          admin_responded_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          order_id?: string | null
          order_item_id?: string | null
          rating: number
          title?: string | null
          content?: string | null
          pros?: string[] | null
          cons?: string[] | null
          images?: string[] | null
          is_verified_purchase?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          helpful_count?: number | null
          not_helpful_count?: number | null
          admin_response?: string | null
          admin_responded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          order_id?: string | null
          order_item_id?: string | null
          rating?: number
          title?: string | null
          content?: string | null
          pros?: string[] | null
          cons?: string[] | null
          images?: string[] | null
          is_verified_purchase?: boolean | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          helpful_count?: number | null
          not_helpful_count?: number | null
          admin_response?: string | null
          admin_responded_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shipping_zones: {
        Row: {
          id: string
          name: string
          countries: string[] | null
          country_codes: string[] | null
          base_rate_inr: number | null
          base_rate_usd: number | null
          per_kg_rate_inr: number | null
          per_kg_rate_usd: number | null
          per_item_rate_inr: number | null
          per_item_rate_usd: number | null
          free_shipping_threshold_inr: number | null
          free_shipping_threshold_usd: number | null
          estimated_days_min: number | null
          estimated_days_max: number | null
          sort_order: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          countries?: string[] | null
          country_codes?: string[] | null
          base_rate_inr?: number | null
          base_rate_usd?: number | null
          per_kg_rate_inr?: number | null
          per_kg_rate_usd?: number | null
          per_item_rate_inr?: number | null
          per_item_rate_usd?: number | null
          free_shipping_threshold_inr?: number | null
          free_shipping_threshold_usd?: number | null
          estimated_days_min?: number | null
          estimated_days_max?: number | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          countries?: string[] | null
          country_codes?: string[] | null
          base_rate_inr?: number | null
          base_rate_usd?: number | null
          per_kg_rate_inr?: number | null
          per_kg_rate_usd?: number | null
          per_item_rate_inr?: number | null
          per_item_rate_usd?: number | null
          free_shipping_threshold_inr?: number | null
          free_shipping_threshold_usd?: number | null
          estimated_days_min?: number | null
          estimated_days_max?: number | null
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: Json | null
          description: string | null
          is_public: boolean | null
          updated_by: string | null
          updated_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          description?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          description?: string | null
          is_public?: boolean | null
          updated_by?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          phone: string | null
          subject: string | null
          message: string
          order_id: string | null
          order_number: string | null
          product_id: string | null
          status: Database["public"]["Enums"]["support_status"] | null
          priority: string | null
          assigned_to: string | null
          admin_notes: string | null
          replied_at: string | null
          resolved_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          phone?: string | null
          subject?: string | null
          message: string
          order_id?: string | null
          order_number?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["support_status"] | null
          priority?: string | null
          assigned_to?: string | null
          admin_notes?: string | null
          replied_at?: string | null
          resolved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          subject?: string | null
          message?: string
          order_id?: string | null
          order_number?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["support_status"] | null
          priority?: string | null
          assigned_to?: string | null
          admin_notes?: string | null
          replied_at?: string | null
          resolved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          id: string
          message_id: string
          user_id: string | null
          content: string
          is_from_admin: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          user_id?: string | null
          content: string
          is_from_admin?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string | null
          content?: string
          is_from_admin?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          granted_by: string | null
          granted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role?: Database["public"]["Enums"]["user_role"]
          granted_by?: string | null
          granted_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          granted_by?: string | null
          granted_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          notify_on_sale: boolean | null
          notify_on_stock: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          notify_on_sale?: boolean | null
          notify_on_stock?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          notify_on_sale?: boolean | null
          notify_on_stock?: boolean | null
          created_at?: string | null
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
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          _user_id: string
        }
        Returns: boolean
      }
      make_user_admin: {
        Args: {
          user_email: string
        }
        Returns: undefined
      }
    }
    Enums: {
      discount_type: "percentage" | "fixed_usd" | "fixed_inr"
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      support_status: "new" | "open" | "replied" | "closed"
      user_role: "customer" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
