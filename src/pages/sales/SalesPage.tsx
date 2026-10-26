import { Search, ShoppingCart, Monitor } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Sale {
  id: string
  sale_number: number
  status: 'open' | 'completed' | 'cancelled'
  subtotal: number
  discount_amount: number
  total: number
  completed_at: string | null
  created_at: string
  customer?: { name: string } | null
}

export function SalesPage() {
  const navigate = useNavigate()
  const { currentEstablishment } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('sales')
      .select('*, customer:customers(name)')
      .eq('establishment_id', currentEstablishment.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setSales((data as unknown as Sale[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = sales.filter((s) =>
    String(s.sale_number).includes(search) || s.customer?.name?.toLowerCase().includes(search.toLowerCase())
  )

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    open: { text: 'Aberta', cls: 'bg-warning-50 text-warning-700' },
    completed: { text: 'Finalizada', cls: 'bg-success-50 text-success-700' },
    cancelled: { text: 'Cancelada', cls: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div>
      <PageHeader title="Vendas / PDV" description="Ponto de venda e registro de vendas"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => navigate('/pdv')}>
              <Monitor className="w-4 h-4" /> Abrir PDV
            </Button>
          </div>
        } />
      <Card>
        <div className="px-6 py-7 sm:px-8 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por número ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
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
            <EmptyState icon={ShoppingCart} title={search ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
              description="Registre a primeira venda no PDV."
              actionLabel={!search ? 'Abrir PDV' : undefined} onAction={!search ? () => navigate('/pdv') : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">#</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Cliente</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Data</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-right">Total</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const st = statusLabel[s.status]
                    return (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-5 font-mono text-xs text-gray-500 hidden sm:table-cell">{s.sale_number}</td>
                        <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{s.customer?.name ?? 'Consumidor final'}</td>
                        <td className="px-4 sm:px-6 py-5 text-gray-600 hidden sm:table-cell">{fmtDate(s.created_at)}</td>
                        <td className="px-4 sm:px-6 py-5 font-medium text-gray-900 text-right">{fmt(s.total)}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.text}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
