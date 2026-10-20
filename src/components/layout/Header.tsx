import { Building2, ChevronDown, LogOut, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {memberships.length > 1 && (
          <div className="relative" ref={estRef}>
            <button
              onClick={() => setShowEstablishments(!showEstablishments)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
            >
              <Building2 className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{currentEstablishment?.name ?? 'Selecionar loja'}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showEstablishments && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {memberships.map((m) => (
                  <button
                    key={m.establishment_id}
                    onClick={() => {
                      if (m.establishment) {
                        setCurrentEstablishment(m.establishment)
                      }
                      setShowEstablishments(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      m.establishment_id === currentEstablishment?.id ? 'bg-primary-50 text-primary-700' : ''
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
            <span className="font-medium">{currentEstablishment.name}</span>
          </div>
        )}
      </div>

      <div className="relative" ref={userRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-sm text-gray-700 hidden sm:inline">
            {user?.user_metadata?.full_name ?? user?.email ?? ''}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {showUserMenu && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name ?? 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                signOut()
                setShowUserMenu(false)
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger-600 hover:bg-danger-50 rounded-b-lg"
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
