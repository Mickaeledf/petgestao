import { DollarSign, Plus, Search } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { FinancialFormDialog } from './FinancialFormDialog'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string | null
  description: string
  amount: number
  due_date: string | null
  paid_date: string | null
  status: string
  payment_method: string | null
  created_at: string
}

export function FinancialPage() {
  const { currentEstablishment } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    let query = supabase.from('financial_transactions').select('*').eq('establishment_id', currentEstablishment.id).order('created_at', { ascending: false }).limit(100)
    if (filter === 'pending') query = query.eq('status', 'pending')
    if (filter === 'paid') query = query.eq('status', 'paid')
    const { data } = await query
    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [currentEstablishment, filter])

  useEffect(() => { load() }, [load])

  const filtered = transactions.filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))

  function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }
  function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    pending: { text: 'Pendente', cls: 'bg-warning-50 text-warning-700' },
    paid: { text: 'Pago', cls: 'bg-success-50 text-success-700' },
    overdue: { text: 'Vencido', cls: 'bg-danger-50 text-danger-700' },
    cancelled: { text: 'Cancelado', cls: 'bg-gray-100 text-gray-600' },
  }

  const totalIncome = filtered.filter((t) => t.type === 'income' && t.status === 'paid').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0)

  return (
    <div>
      <PageHeader title="Financeiro" description="Contas a pagar, receber e lançamentos"
        actions={<Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Novo lançamento</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Receitas (pagas)</p><p className="text-xl font-bold text-success-600">{fmt(totalIncome)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Despesas (pagas)</p><p className="text-xl font-bold text-danger-600">{fmt(totalExpense)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Saldo</p><p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-success-600' : 'text-danger-600'}`}>{fmt(totalIncome - totalExpense)}</p></CardContent></Card>
      </div>

      <Card>
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar lançamento..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'paid'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border ${filter === f ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Pagos'}
              </button>
            ))}
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Carregando…</p></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={DollarSign} title="Nenhum lançamento" description="Registre receitas e despesas."
              actionLabel="Novo lançamento" onAction={() => setShowForm(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Tipo</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Descrição</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Categoria</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Vencimento</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-right">Valor</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Status</th>
              </tr></thead><tbody>
                {filtered.map((t) => {
                  const st = statusLabel[t.status] ?? { text: t.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => { setEditing(t); setShowForm(true) }}>
                      <td className="px-4 sm:px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>{t.type === 'income' ? 'Receita' : 'Despesa'}</span></td>
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{t.description}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600">{t.category ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 whitespace-nowrap">{fmtDate(t.due_date)}</td>
                      <td className={`px-4 sm:px-6 py-5 font-medium text-right whitespace-nowrap ${t.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>{fmt(t.amount)}</td>
                      <td className="px-4 sm:px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.text}</span></td>
                    </tr>)
                })}
              </tbody></table>
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && <FinancialFormDialog transaction={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
