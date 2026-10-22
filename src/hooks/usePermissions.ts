import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { AppModule, PermissionAction, RolePermission, MemberPermissionOverride } from '@/types'

interface ModulePermissions {
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

const ALL_MODULES: AppModule[] = [
  'dashboard', 'sales', 'pdv', 'cash_register',
  'customers', 'pets', 'products', 'services', 'professionals', 'suppliers',
  'schedule', 'service_orders', 'stock', 'purchases',
  'financial', 'reports', 'users', 'settings', 'license',
]

const EMPTY_PERMS: ModulePermissions = { can_view: false, can_create: false, can_edit: false, can_delete: false }
const FULL_PERMS: ModulePermissions = { can_view: true, can_create: true, can_edit: true, can_delete: true }

export function usePermissions() {
  const { memberships, currentEstablishment } = useAuth()
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])
  const [overrides, setOverrides] = useState<MemberPermissionOverride[]>([])
  const [loading, setLoading] = useState(true)

  const currentMembership = useMemo(() =>
    memberships.find(m => m.establishment_id === currentEstablishment?.id),
    [memberships, currentEstablishment]
  )

  const isOwner = useMemo(() =>
    currentMembership?.role?.is_owner === true,
    [currentMembership]
  )

  const loadPermissions = useCallback(async () => {
    if (!currentMembership?.role_id || !currentMembership?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    const [rpRes, ovRes] = await Promise.all([
      supabase
        .from('role_permissions')
        .select('*')
        .eq('role_id', currentMembership.role_id),
      supabase
        .from('member_permission_overrides')
        .select('*')
        .eq('membership_id', currentMembership.id),
    ])

    setRolePermissions((rpRes.data as RolePermission[]) ?? [])
    setOverrides((ovRes.data as MemberPermissionOverride[]) ?? [])
    setLoading(false)
  }, [currentMembership])

  useEffect(() => { loadPermissions() }, [loadPermissions])

  const permissionsMap = useMemo(() => {
    const map: Record<string, ModulePermissions> = {}

    for (const mod of ALL_MODULES) {
      if (isOwner) {
        map[mod] = { ...FULL_PERMS }
        continue
      }

      const rp = rolePermissions.find(p => p.module === mod)
      const base: ModulePermissions = rp
        ? { can_view: rp.can_view, can_create: rp.can_create, can_edit: rp.can_edit, can_delete: rp.can_delete }
        : { ...EMPTY_PERMS }

      const ov = overrides.find(o => o.module === mod)
      if (ov) {
        if (ov.can_view !== null) base.can_view = ov.can_view
        if (ov.can_create !== null) base.can_create = ov.can_create
        if (ov.can_edit !== null) base.can_edit = ov.can_edit
        if (ov.can_delete !== null) base.can_delete = ov.can_delete
      }

      map[mod] = base
    }

    return map
  }, [isOwner, rolePermissions, overrides])

  const can = useCallback((module: AppModule, action: PermissionAction = 'view'): boolean => {
    if (isOwner) return true
    const perms = permissionsMap[module]
    if (!perms) return false
    switch (action) {
      case 'view': return perms.can_view
      case 'create': return perms.can_create
      case 'edit': return perms.can_edit
      case 'delete': return perms.can_delete
      default: return false
    }
  }, [isOwner, permissionsMap])

  const canView = useCallback((module: AppModule) => can(module, 'view'), [can])
  const canCreate = useCallback((module: AppModule) => can(module, 'create'), [can])
  const canEdit = useCallback((module: AppModule) => can(module, 'edit'), [can])
  const canDelete = useCallback((module: AppModule) => can(module, 'delete'), [can])

  const visibleModules = useMemo(() =>
    ALL_MODULES.filter(mod => can(mod, 'view')),
    [can]
  )

  return {
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    isOwner,
    loading,
    permissionsMap,
    visibleModules,
    currentMembership,
    roleName: currentMembership?.role?.name ?? null,
    reload: loadPermissions,
  }
}

export const MODULE_ROUTE_MAP: Record<string, AppModule> = {
  '/': 'dashboard',
  '/sales': 'sales',
  '/pdv': 'pdv',
  '/cash-register': 'cash_register',
  '/customers': 'customers',
  '/pets': 'pets',
  '/products': 'products',
  '/services': 'services',
  '/professionals': 'professionals',
  '/suppliers': 'suppliers',
  '/schedule': 'schedule',
  '/service-orders': 'service_orders',
  '/stock': 'stock',
  '/purchases': 'purchases',
  '/financial': 'financial',
  '/reports': 'reports',
  '/users': 'users',
  '/settings': 'settings',
  '/license': 'license',
}

export const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'Dashboard',
  sales: 'Vendas',
  pdv: 'PDV',
  cash_register: 'Caixa',
  customers: 'Tutores',
  pets: 'Animais',
  products: 'Produtos',
  services: 'Serviços',
  professionals: 'Profissionais',
  suppliers: 'Fornecedores',
  schedule: 'Agenda',
  service_orders: 'Atendimentos',
  stock: 'Estoque',
  purchases: 'Compras',
  financial: 'Financeiro',
  reports: 'Relatórios',
  users: 'Usuários',
  settings: 'Configurações',
  license: 'Licença',
}
