import { Plus, Scissors, Search } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/types'
import { ServiceFormDialog } from './ServiceFormDialog'

export function ServicesPage() {
  const { currentEstablishment } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const load = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('establishment_id', currentEstablishment.id)
      .order('name')
    setServices((data as Service[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Gerencie os serviços oferecidos pelo estabelecimento"
        actions={
          <Button onClick={() => { setEditingService(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> Novo serviço
          </Button>
        }
      />
      <Card>
        <div className="px-6 py-7 sm:px-8 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar serviço..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Carregando…</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Scissors} title={search ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'} description="Cadastre os serviços de banho e tosa oferecidos."
              actionLabel={!search ? 'Cadastrar serviço' : undefined} onAction={!search ? () => setShowForm(true) : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Nome</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Descrição</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-right">Preço base</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-right hidden sm:table-cell">Duração</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditingService(s); setShowForm(true) }}>
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 max-w-xs truncate hidden sm:table-cell">{s.description ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-900 text-right">{fmt(s.base_price)}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 text-right hidden sm:table-cell">{s.duration_minutes} min</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.active ? 'Ativo' : 'Inativo'}
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
      {showForm && <ServiceFormDialog service={editingService} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
