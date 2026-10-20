export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      establishments: {
        Row: {
          id: string
          name: string
          legal_name: string | null
          document: string | null
          email: string | null
          phone: string | null
          address: Json | null
          timezone: string
          settings: Json | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          legal_name?: string | null
          document?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          timezone?: string
          settings?: Json | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          legal_name?: string | null
          document?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          timezone?: string
          settings?: Json | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          establishment_id: string
          user_id: string
          role_id: string
          status: 'active' | 'inactive'
          created_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          user_id: string
          role_id: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          user_id?: string
          role_id?: string
          status?: 'active' | 'inactive'
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          establishment_id: string | null
          name: string
          description: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          establishment_id?: string | null
          name: string
          description?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string | null
          name?: string
          description?: string | null
          is_system?: boolean
          created_at?: string
        }
      }
      permissions: {
        Row: {
          id: string
          key: string
          description: string | null
          module: string
        }
        Insert: {
          id?: string
          key: string
          description?: string | null
          module: string
        }
        Update: {
          id?: string
          key?: string
          description?: string | null
          module?: string
        }
      }
      role_permissions: {
        Row: {
          role_id: string
          permission_id: string
        }
        Insert: {
          role_id: string
          permission_id: string
        }
        Update: {
          role_id?: string
          permission_id?: string
        }
      }
      categories: {
        Row: {
          id: string
          establishment_id: string
          name: string
          description: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          name: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          establishment_id: string
          category_id: string | null
          name: string
          description: string | null
          internal_code: string | null
          barcode: string | null
          brand: string | null
          unit: string
          cost_price: number
          sale_price: number
          minimum_stock: number
          maximum_stock: number | null
          track_lots: boolean
          track_expiry: boolean
          active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          category_id?: string | null
          name: string
          description?: string | null
          internal_code?: string | null
          barcode?: string | null
          brand?: string | null
          unit?: string
          cost_price?: number
          sale_price: number
          minimum_stock?: number
          maximum_stock?: number | null
          track_lots?: boolean
          track_expiry?: boolean
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          internal_code?: string | null
          barcode?: string | null
          brand?: string | null
          unit?: string
          cost_price?: number
          sale_price?: number
          minimum_stock?: number
          maximum_stock?: number | null
          track_lots?: boolean
          track_expiry?: boolean
          active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          establishment_id: string
          name: string
          phone: string | null
          email: string | null
          document: string | null
          address: Json | null
          contact_preferences: Json | null
          notes: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          name: string
          phone?: string | null
          email?: string | null
          document?: string | null
          address?: Json | null
          contact_preferences?: Json | null
          notes?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          document?: string | null
          address?: Json | null
          contact_preferences?: Json | null
          notes?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          establishment_id: string
          customer_id: string
          name: string
          species: string
          breed: string | null
          sex: string | null
          birth_date: string | null
          size: string | null
          color: string | null
          weight: number | null
          weight_date: string | null
          photo_path: string | null
          behavior_notes: string | null
          care_notes: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          establishment_id: string
          customer_id: string
          name: string
          species: string
          breed?: string | null
          sex?: string | null
          birth_date?: string | null
          size?: string | null
          color?: string | null
          weight?: number | null
          weight_date?: string | null
          photo_path?: string | null
          behavior_notes?: string | null
          care_notes?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          establishment_id?: string
          customer_id?: string
          name?: string
          species?: string
          breed?: string | null
          sex?: string | null
          birth_date?: string | null
          size?: string | null
          color?: string | null
          weight?: number | null
          weight_date?: string | null
          photo_path?: string | null
          behavior_notes?: string | null
          care_notes?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
