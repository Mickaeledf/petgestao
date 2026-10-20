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
  Package,
  Scissors,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Users2,
  Clipboard,
  ChevronLeft,
  X,
  PawPrint,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { path: '/', label: 'Dashboard', icon: Home },
      { path: '/sales', label: 'Vendas / PDV', icon: ShoppingCart },
      { path: '/cash-register', label: 'Caixa', icon: CreditCard },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { path: '/customers', label: 'Tutores', icon: Users },
      { path: '/pets', label: 'Animais', icon: Dog },
      { path: '/products', label: 'Produtos', icon: Package },
      { path: '/services', label: 'Serviços', icon: Scissors },
      { path: '/professionals', label: 'Profissionais', icon: Users2 },
      { path: '/suppliers', label: 'Fornecedores', icon: FileText },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { path: '/schedule', label: 'Agenda', icon: Calendar },
      { path: '/service-orders', label: 'Atendimentos', icon: Clipboard },
      { path: '/stock', label: 'Estoque', icon: Box },
      { path: '/purchases', label: 'Compras', icon: Truck },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { path: '/financial', label: 'Financeiro', icon: DollarSign },
      { path: '/reports', label: 'Relatórios', icon: BarChart3 },
      { path: '/users', label: 'Usuários', icon: UserCog },
      { path: '/settings', label: 'Configurações', icon: Settings },
      { path: '/license', label: 'Licença', icon: Key },
    ],
  },
]

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  const location = useLocation()

  const prevPath = useRef(location.pathname)
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname
      onClose()
    }
  }, [location.pathname, onClose])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-sidebar z-50 flex flex-col transition-all duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'}
          w-72
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">PetGestão</span>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sidebar-text lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-white/10 text-sidebar-text hidden lg:block"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {menuGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/40">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="border-t border-white/10 my-2 mx-2" />}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 font-medium border-l-2 border-emerald-400'
                          : 'text-sidebar-text hover:bg-white/5 hover:text-white'
                      } ${collapsed ? 'justify-center px-2' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {!collapsed && (
            <p className="text-[11px] text-sidebar-text/40">PetGestão v0.1.0</p>
          )}
        </div>
      </aside>
    </>
  )
}
