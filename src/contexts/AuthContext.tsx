import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Establishment, Membership } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  memberships: Membership[]
  currentEstablishment: Establishment | null
  setCurrentEstablishment: (establishment: Establishment | null) => void
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  reloadMemberships: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [currentEstablishment, setCurrentEstablishment] = useState<Establishment | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        loadMemberships(s.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        loadMemberships(s.user.id)
      } else {
        setMemberships([])
        setCurrentEstablishment(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadMemberships(userId: string) {
    const { data } = await supabase
      .from('memberships')
      .select('*, establishment:establishments(*), role:roles(*, role_permissions(*))')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (data && data.length > 0) {
      setMemberships(data as unknown as Membership[])
      const saved = localStorage.getItem('petgestao_current_establishment')
      const found = saved ? data.find((m: Record<string, unknown>) => m.establishment_id === saved) : null
      const first = found ?? data[0]
      if (first) {
        const est = (first as unknown as Membership).establishment ?? null
        setCurrentEstablishment(est)
        if (est) {
          localStorage.setItem('petgestao_current_establishment', est.id)
        }
      }
    }
  }

  function handleSetCurrentEstablishment(establishment: Establishment | null) {
    setCurrentEstablishment(establishment)
    if (establishment) {
      localStorage.setItem('petgestao_current_establishment', establishment.id)
    } else {
      localStorage.removeItem('petgestao_current_establishment')
    }
  }

  async function reloadMemberships() {
    if (user) await loadMemberships(user.id)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { error: error ? new Error(error.message) : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMemberships([])
    setCurrentEstablishment(null)
    localStorage.removeItem('petgestao_current_establishment')
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error: error ? new Error(error.message) : null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        memberships,
        currentEstablishment,
        setCurrentEstablishment: handleSetCurrentEstablishment,
        signIn,
        signUp,
        signOut,
        resetPassword,
        reloadMemberships,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
