import { Building2, ChevronDown, LogOut, Menu, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, currentEstablishment, memberships, setCurrentEstablishment, signOut } = useAuth()
  const [showEstablishments, setShowEstablishments] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const estRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (estRef.current && !estRef.current.contains(e.target as Node)) {
        setShowEstablishments(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-1 rounded-lg hover:bg-gray-100 lg:hidden"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {memberships.length > 1 && (
          <div className="relative" ref={estRef}>
            <button
              onClick={() => setShowEstablishments(!showEstablishments)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
            >
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="font-medium truncate max-w-[150px] sm:max-w-none">
                {currentEstablishment?.name ?? 'Selecionar loja'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showEstablishments && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                {memberships.map((m) => (
                  <button
                    key={m.establishment_id}
                    onClick={() => {
                      if (m.establishment) setCurrentEstablishment(m.establishment)
                      setShowEstablishments(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${
                      m.establishment_id === currentEstablishment?.id ? 'bg-emerald-50 text-emerald-700' : ''
                    }`}
                  >
                    {m.establishment?.name ?? m.establishment_id}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {memberships.length <= 1 && currentEstablishment && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="font-medium truncate max-w-[200px]">{currentEstablishment.name}</span>
          </div>
        )}
      </div>

      <div className="relative" ref={userRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm text-gray-700 hidden sm:inline truncate max-w-[120px]">
            {user?.user_metadata?.full_name ?? user?.email ?? ''}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
        </button>

        {showUserMenu && (
          <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name ?? 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { signOut(); setShowUserMenu(false) }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger-600 hover:bg-danger-50 rounded-b-xl"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
