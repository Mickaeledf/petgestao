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
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar profissional..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users2} title={search ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
              description="Cadastre os profissionais que realizam os serviços."
              actionLabel={!search ? 'Cadastrar profissional' : undefined} onAction={!search ? () => setShowForm(true) : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Nome</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Telefone</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditing(p); setShowForm(true) }}>
                      <td className="px-3 sm:px-6 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-600">{p.phone ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                          {p.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && <ProfessionalFormDialog professional={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
