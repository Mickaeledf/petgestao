import {
  BarChart3,
  Box,
  Calendar,
  Cloud,
  CreditCard,
  Dog,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  Key,
  LogOut,
  MessageSquare,
  Monitor,
  Moon,
  Package,
  PawPrint,
  Scissors,
  Settings,
  ShoppingCart,
  Sun,
  Truck,
  UserCog,
  Users,
  Users2,
  Clipboard,
  X,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
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
  const { user, currentEstablishment, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()

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

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-primary-500/20 text-primary-300 font-medium'
        : 'text-sidebar-text hover:bg-white/5 hover:text-white'
    }`

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
        style={{ width: '240px', background: 'linear-gradient(180deg, var(--color-sidebar) 0%, var(--color-sidebar-dark) 100%)' }}
      >
        {/* Logo e nome */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
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

        {/* Nome da empresa */}
        {currentEstablishment && (
          <div className="px-4 py-2.5 border-b border-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-text/50">
              {currentEstablishment.name}
            </p>
          </div>
        )}

        {/* Menu de navegação */}
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
                    className={({ isActive }) => linkClass(isActive)}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Rodapé: Mensagens, Suporte, Configurações, tema, nuvem, email, sair */}
        <div className="border-t border-white/10 px-2 py-2 space-y-0.5">
          <NavLink to="/messages" className={({ isActive }) => linkClass(isActive)}>
            <MessageSquare className="w-[18px] h-[18px] shrink-0" />
            <span>Mensagens</span>
          </NavLink>

          <NavLink to="/support" className={({ isActive }) => linkClass(isActive)}>
            <HelpCircle className="w-[18px] h-[18px] shrink-0" />
            <span>Suporte</span>
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
            <Settings className="w-[18px] h-[18px] shrink-0" />
            <span>Configurações</span>
          </NavLink>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-sidebar-text hover:bg-white/5 hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
          </button>
        </div>

        <div className="border-t border-white/5 px-3 py-2 space-y-1">
          <div className="flex items-center gap-2 px-0 py-1 text-[11px] text-sidebar-text/50">
            <Cloud className="w-3.5 h-3.5" />
            <span>Salvo na nuvem</span>
          </div>
          <p className="text-[11px] text-sidebar-text/40 truncate">
            {user?.email ?? ''}
          </p>
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-0 py-2 rounded-lg text-sm text-danger-400 hover:text-danger-300 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  )
}
