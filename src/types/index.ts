export interface Establishment {
  id: string
  name: string
  legal_name: string | null
  document: string | null
  email: string | null
  phone: string | null
  address: Record<string, unknown> | null
  timezone: string
  settings: Record<string, unknown> | null
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  establishment_id: string
  user_id: string
  role_id: string
  status: 'active' | 'inactive'
  created_at: string
  role?: Role
  establishment?: Establishment
}

export interface Role {
  id: string
  establishment_id: string | null
  name: string
  description: string | null
  is_system: boolean
  is_owner: boolean
  created_at: string
  role_permissions?: RolePermission[]
}

export interface RolePermission {
  id: string
  role_id: string
  module: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface MemberPermissionOverride {
  id: string
  membership_id: string
  module: string
  can_view: boolean | null
  can_create: boolean | null
  can_edit: boolean | null
  can_delete: boolean | null
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

export type AppModule =
  | 'dashboard' | 'sales' | 'pdv' | 'cash_register'
  | 'customers' | 'pets' | 'products' | 'services' | 'professionals' | 'suppliers'
  | 'schedule' | 'service_orders' | 'stock' | 'purchases'
  | 'financial' | 'reports' | 'users' | 'settings' | 'license'

export interface Permission {
  id: string
  key: string
  description: string | null
  module: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

export interface Category {
  id: string
  establishment_id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export interface Product {
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
  category?: Category
}

export interface Customer {
  id: string
  establishment_id: string
  name: string
  phone: string | null
  email: string | null
  document: string | null
  address: Record<string, unknown> | null
  contact_preferences: Record<string, unknown> | null
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Pet {
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
  customer?: Customer
}

export interface Service {
  id: string
  establishment_id: string
  name: string
  description: string | null
  base_price: number
  duration_minutes: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Professional {
  id: string
  establishment_id: string
  user_id: string | null
  name: string
  phone: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  establishment_id: string
  name: string
  document: string | null
  phone: string | null
  email: string | null
  address: string | null
  contact_name: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}
