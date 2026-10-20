import { Clipboard, Plus, Search } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ServiceOrderFormDialog } from './ServiceOrderFormDialog'

interface ServiceOrder {
  id: string
  order_number: number
  status: string
  checkin_notes: string | null
  checkout_notes: string | null
  total: number | null
  created_at: string
  customer?: { name: string } | null
  pet?: { name: string } | null
  professional?: { name: string } | null
}

export function ServiceOrdersPage() {
  const { currentEstablishment } = useAuth()
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ServiceOrder | null>(null)

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('service_orders')
      .select('*, customer:customers(name), pet:pets(name), professional:professionals(name)')
      .eq('establishment_id', currentEstablishment.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders((data as unknown as ServiceOrder[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return String(o.order_number).includes(q) || o.customer?.name?.toLowerCase().includes(q) || o.pet?.name?.toLowerCase().includes(q)
  })

  function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }
  function fmtDate(d: string) { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    pending: { text: 'Pendente', cls: 'bg-warning-50 text-warning-700' },
    in_progress: { text: 'Em andamento', cls: 'bg-primary-50 text-primary-700' },
    completed: { text: 'Concluído', cls: 'bg-success-50 text-success-700' },
    delivered: { text: 'Entregue', cls: 'bg-gray-100 text-gray-800' },
    cancelled: { text: 'Cancelado', cls: 'bg-danger-50 text-danger-700' },
  }

  return (
    <div>
      <PageHeader title="Ordens de Serviço" description="Controle de banho, tosa e atendimentos"
        actions={<Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Nova OS</Button>} />
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por número, cliente ou pet..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Clipboard} title="Nenhum atendimento" description="Crie ordens de serviço para controlar banho e tosa."
              actionLabel="Nova OS" onAction={() => setShowForm(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">#</th>
                <th className="px-6 py-3 font-medium text-gray-500">Cliente</th>
                <th className="px-6 py-3 font-medium text-gray-500">Pet</th>
                <th className="px-6 py-3 font-medium text-gray-500">Profissional</th>
                <th className="px-6 py-3 font-medium text-gray-500">Data</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-right">Total</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
              </tr></thead><tbody>
                {filtered.map((o) => {
                  const st = statusLabel[o.status] ?? { text: o.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => { setEditing(o); setShowForm(true) }}>
                      <td className="px-6 py-3 font-mono text-gray-900">{o.order_number}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{o.customer?.name ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{o.pet?.name ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{o.professional?.name ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{fmtDate(o.created_at)}</td>
                      <td className="px-6 py-3 text-gray-900 text-right">{o.total ? fmt(o.total) : '—'}</td>
                      <td className="px-6 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.text}</span></td>
                    </tr>)
                })}
              </tbody></table>
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && <ServiceOrderFormDialog order={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
