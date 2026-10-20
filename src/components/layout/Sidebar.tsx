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
  ChevronRight,
  PawPrint,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const menuItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/sales', label: 'Vendas / PDV', icon: ShoppingCart },
  { path: '/products', label: 'Produtos', icon: Package },
  { path: '/stock', label: 'Estoque', icon: Box },
  { path: '/customers', label: 'Tutores', icon: Users },
  { path: '/pets', label: 'Animais', icon: Dog },
  { path: '/schedule', label: 'Agenda', icon: Calendar },
  { path: '/services', label: 'Serviços', icon: Scissors },
  { path: '/professionals', label: 'Profissionais', icon: Users2 },
  { path: '/service-orders', label: 'Atendimentos', icon: Clipboard },
  { path: '/cash-register', label: 'Caixa', icon: CreditCard },
  { path: '/financial', label: 'Financeiro', icon: DollarSign },
  { path: '/purchases', label: 'Compras', icon: Truck },
  { path: '/suppliers', label: 'Fornecedores', icon: FileText },
  { path: '/reports', label: 'Relatórios', icon: BarChart3 },
  { path: '/users', label: 'Usuários', icon: UserCog },
  { path: '/settings', label: 'Configurações', icon: Settings },
  { path: '/license', label: 'Licença', icon: Key },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-sidebar text-sidebar-text z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <PawPrint className="w-7 h-7 text-primary-400" />
            <span className="text-lg font-bold text-white">PetGestão</span>
          </div>
        )}
        {collapsed && <PawPrint className="w-7 h-7 text-primary-400 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-active text-sidebar-text-active font-medium'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!collapsed && (
          <p className="text-xs text-sidebar-text/60">PetGestão v0.1.0</p>
        )}
      </div>
    </aside>
  )
}
