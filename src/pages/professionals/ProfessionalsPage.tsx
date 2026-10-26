import { Plus, Search, Users2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Professional } from '@/types'
import { ProfessionalFormDialog } from './ProfessionalFormDialog'

export function ProfessionalsPage() {
  const { currentEstablishment } = useAuth()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Professional | null>(null)

  const load = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const { data } = await supabase
      .from('professionals')
      .select('*')
      .eq('establishment_id', currentEstablishment.id)
      .order('name')
    setProfessionals((data as Professional[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = professionals.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="Profissionais" description="Gerencie os profissionais de banho e tosa"
        actions={<Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Novo profissional</Button>} />
      <Card>
        <div className="px-6 py-7 sm:px-8 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar profissional..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Carregando…</p>
            </div>
          ) : filtered.length === 0 && search ? (
            <EmptyState icon={Users2} title="Nenhum profissional encontrado"
              description="Tente buscar com outros termos." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Nome</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Telefone</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditing(p); setShowForm(true) }}>
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600">{p.phone ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  )) : [
                    { name: 'Maria Silva', phone: '(11) 99876-5432', active: true },
                    { name: 'João Santos', phone: '(11) 98765-4321', active: true },
                    { name: 'Ana Oliveira', phone: '(11) 97654-3210', active: false },
                  ].map((g, i) => (
                    <tr key={i} className="border-b border-gray-50 opacity-40 pointer-events-none select-none">
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{g.name}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600">{g.phone}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${g.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                          {g.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">Os dados acima são exemplos. Cadastre seus profissionais.</p>
                  <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> Cadastrar profissional</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && <ProfessionalFormDialog professional={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
