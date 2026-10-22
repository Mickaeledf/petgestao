import {
  BarChart3,
  Box,
  Calendar,
  CreditCard,
  Dog,
  DollarSign,
  FileText,
  Home,
  Key,
  Monitor,
  Package,
  Scissors,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Users2,
  Clipboard,
  X,
  PawPrint,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import type { AppModule } from '@/types'

const menuGroups: { label: string; items: { path: string; label: string; icon: typeof Home; module: AppModule }[] }[] = [
  {
    label: 'Principal',
    items: [
      { path: '/', label: 'Dashboard', icon: Home, module: 'dashboard' },
      { path: '/sales', label: 'Vendas', icon: ShoppingCart, module: 'sales' },
      { path: '/pdv', label: 'PDV', icon: Monitor, module: 'pdv' },
      { path: '/cash-register', label: 'Caixa', icon: CreditCard, module: 'cash_register' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { path: '/customers', label: 'Tutores', icon: Users, module: 'customers' },
      { path: '/pets', label: 'Animais', icon: Dog, module: 'pets' },
      { path: '/products', label: 'Produtos', icon: Package, module: 'products' },
      { path: '/services', label: 'Serviços', icon: Scissors, module: 'services' },
      { path: '/professionals', label: 'Profissionais', icon: Users2, module: 'professionals' },
      { path: '/suppliers', label: 'Fornecedores', icon: FileText, module: 'suppliers' },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { path: '/schedule', label: 'Agenda', icon: Calendar, module: 'schedule' },
      { path: '/service-orders', label: 'Atendimentos', icon: Clipboard, module: 'service_orders' },
      { path: '/stock', label: 'Estoque', icon: Box, module: 'stock' },
      { path: '/purchases', label: 'Compras', icon: Truck, module: 'purchases' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { path: '/financial', label: 'Financeiro', icon: DollarSign, module: 'financial' },
      { path: '/reports', label: 'Relatórios', icon: BarChart3, module: 'reports' },
      { path: '/users', label: 'Usuários', icon: UserCog, module: 'users' },
      { path: '/settings', label: 'Configurações', icon: Settings, module: 'settings' },
      { path: '/license', label: 'Licença', icon: Key, module: 'license' },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation()
  const { canView, loading: permLoading } = usePermissions()

  const prevPath = useRef(location.pathname)
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname
      onClose()
    }
  }, [location.pathname, onClose])

  const filteredGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permLoading || canView(item.module)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-sidebar z-50 flex flex-col transition-all duration-300 w-64
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">PetGestão</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sidebar-text lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-300 font-medium border-l-2 border-indigo-400'
                          : 'text-sidebar-text hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <p className="text-[11px] text-sidebar-text/40">PetGestão v0.1.0</p>
        </div>
      </aside>
    </>
  )
}
