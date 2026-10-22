import { Plus, Search, Truck } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { PurchaseFormDialog } from './PurchaseFormDialog'

interface Purchase {
  id: string
  purchase_number: number
  status: string
  total: number
  notes: string | null
  expected_date: string | null
  received_at: string | null
  created_at: string
  supplier?: { name: string } | null
}

export function PurchasesPage() {
  const { currentEstablishment } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Purchase | null>(null)

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('purchases')
      .select('*, supplier:suppliers(name)')
      .eq('establishment_id', currentEstablishment.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setPurchases((data as unknown as Purchase[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = purchases.filter((p) => {
    const q = search.toLowerCase()
    return String(p.purchase_number).includes(q) || p.supplier?.name?.toLowerCase().includes(q)
  })

  function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }
  function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    pending: { text: 'Pendente', cls: 'bg-warning-50 text-warning-700' },
    received: { text: 'Recebido', cls: 'bg-success-50 text-success-700' },
    partial: { text: 'Parcial', cls: 'bg-primary-50 text-primary-700' },
    cancelled: { text: 'Cancelado', cls: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div>
      <PageHeader title="Compras" description="Pedidos de compra e recebimento de mercadorias"
        actions={<Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Nova compra</Button>} />
      <Card>
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por número ou fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Truck} title="Nenhuma compra" description="Registre compras de fornecedores."
              actionLabel="Nova compra" onAction={() => setShowForm(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">#</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Fornecedor</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Data</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap hidden md:table-cell">Previsão</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap text-right">Total</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Status</th>
              </tr></thead><tbody>
                {filtered.map((p) => {
                  const st = statusLabel[p.status] ?? { text: p.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => { setEditing(p); setShowForm(true) }}>
                      <td className="px-4 sm:px-6 py-4 font-mono text-gray-900 hidden sm:table-cell">{p.purchase_number}</td>
                      <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">{p.supplier?.name ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600 whitespace-nowrap hidden sm:table-cell">{fmtDate(p.created_at)}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600 whitespace-nowrap hidden md:table-cell">{fmtDate(p.expected_date)}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-900 text-right font-medium whitespace-nowrap">{fmt(p.total)}</td>
                      <td className="px-4 sm:px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.text}</span></td>
                    </tr>)
                })}
              </tbody></table>
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && <PurchaseFormDialog purchase={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
