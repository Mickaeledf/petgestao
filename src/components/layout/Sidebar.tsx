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

const menuGroups = [
  {
    label: 'Principal',
    items: [
      { path: '/', label: 'Dashboard', icon: Home },
      { path: '/sales', label: 'Vendas', icon: ShoppingCart },
      { path: '/pdv', label: 'PDV', icon: Monitor },
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
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
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
          {menuGroups.map((group) => (
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
