import { BarChart3, Download, FileText } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type ReportType = 'sales' | 'financial' | 'stock' | 'services' | 'customers'

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('pt-BR') }

export function ReportsPage() {
  const { currentEstablishment } = useAuth()
  const [activeReport, setActiveReport] = useState<ReportType>('sales')
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0] })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<Record<string, any>>({})

  const reports: { key: ReportType; label: string }[] = [
    { key: 'sales', label: 'Vendas' },
    { key: 'financial', label: 'Financeiro' },
    { key: 'stock', label: 'Estoque' },
    { key: 'services', label: 'Serviços' },
    { key: 'customers', label: 'Clientes' },
  ]

  const generate = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const eid = currentEstablishment.id

    if (activeReport === 'sales') {
      const { data: sales } = await supabase.from('sales').select('*, customer:customers(name)')
        .eq('establishment_id', eid).eq('status', 'completed')
        .gte('completed_at', `${dateFrom}T00:00:00`).lte('completed_at', `${dateTo}T23:59:59`)
        .order('completed_at', { ascending: false })
      const rows = (sales ?? []) as any[]
      setData(rows)
      setSummary({ total: rows.reduce((s, r) => s + (r.total ?? 0), 0), count: rows.length, avg: rows.length ? rows.reduce((s, r) => s + (r.total ?? 0), 0) / rows.length : 0 })
    } else if (activeReport === 'financial') {
      const { data: txs } = await supabase.from('financial_transactions').select('*')
        .eq('establishment_id', eid)
        .gte('due_date', dateFrom).lte('due_date', dateTo)
        .order('due_date')
      const rows = (txs ?? []) as any[]
      const income = rows.filter(r => r.type === 'income' && r.status === 'paid').reduce((s, r) => s + r.amount, 0)
      const expense = rows.filter(r => r.type === 'expense' && r.status === 'paid').reduce((s, r) => s + r.amount, 0)
      setData(rows)
      setSummary({ income, expense, balance: income - expense, pending: rows.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0) })
    } else if (activeReport === 'stock') {
      const { data: stocks } = await supabase.from('stock_balances').select('*, product:products(name, unit, minimum_stock, sale_price)')
        .eq('establishment_id', eid)
      const rows = ((stocks ?? []) as any[]).sort((a, b) => a.quantity - b.quantity)
      setData(rows)
      setSummary({ total: rows.length, low: rows.filter(r => r.product && r.quantity <= (r.product.minimum_stock ?? 0) && r.quantity > 0).length, zero: rows.filter(r => r.quantity === 0).length,
        valorEstoque: rows.reduce((s, r) => s + (r.quantity * (r.product?.sale_price ?? 0)), 0) })
    } else if (activeReport === 'services') {
      const { data: appts } = await supabase.from('appointments').select('*, service:services(name), professional:professionals(name)')
        .eq('establishment_id', eid)
        .gte('date', dateFrom).lte('date', dateTo)
        .order('date', { ascending: false })
      const rows = (appts ?? []) as any[]
      setData(rows)
      const completed = rows.filter(r => r.status === 'completed')
      setSummary({ total: rows.length, completed: completed.length, cancelled: rows.filter(r => r.status === 'cancelled').length,
        revenue: completed.reduce((s, r) => s + (r.price ?? 0), 0) })
    } else if (activeReport === 'customers') {
      const { data: custs } = await supabase.from('customers').select('*, pets:pets(id)')
        .eq('establishment_id', eid).eq('status', 'active').order('name')
      const rows = (custs ?? []) as any[]
      setData(rows)
      setSummary({ total: rows.length, withPets: rows.filter(r => r.pets?.length > 0).length })
    }
    setLoading(false)
  }, [currentEstablishment, activeReport, dateFrom, dateTo])

  return (
    <div>
      <PageHeader title="Relatórios" description="Relatórios de vendas, estoque, serviços e financeiro" />

      <div className="flex flex-wrap gap-2 mb-4">
        {reports.map(r => (
          <button key={r.key} onClick={() => { setActiveReport(r.key); setData([]) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeReport === r.key ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {r.label}
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-4">
          {activeReport !== 'stock' && activeReport !== 'customers' && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">De</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">Até</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </>
          )}
          <Button onClick={generate} loading={loading}><FileText className="w-4 h-4" /> Gerar relatório</Button>
        </CardContent>
      </Card>

      {data.length > 0 && (
        <>
          {activeReport === 'sales' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Total vendas</p><p className="text-xl font-bold text-success-600">{fmt(summary.total)}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Qtd. vendas</p><p className="text-xl font-bold text-gray-900">{summary.count}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Ticket médio</p><p className="text-xl font-bold text-primary-600">{fmt(summary.avg)}</p></CardContent></Card>
            </div>
          )}
          {activeReport === 'financial' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Receitas</p><p className="text-xl font-bold text-success-600">{fmt(summary.income)}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Despesas</p><p className="text-xl font-bold text-danger-600">{fmt(summary.expense)}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Saldo</p><p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>{fmt(summary.balance)}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Pendente</p><p className="text-xl font-bold text-warning-600">{fmt(summary.pending)}</p></CardContent></Card>
            </div>
          )}
          {activeReport === 'stock' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Total itens</p><p className="text-xl font-bold text-gray-900">{summary.total}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Estoque baixo</p><p className="text-xl font-bold text-warning-600">{summary.low}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Sem estoque</p><p className="text-xl font-bold text-danger-600">{summary.zero}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Valor estoque</p><p className="text-xl font-bold text-primary-600">{fmt(summary.valorEstoque)}</p></CardContent></Card>
            </div>
          )}
          {activeReport === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Total agend.</p><p className="text-xl font-bold text-gray-900">{summary.total}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Concluídos</p><p className="text-xl font-bold text-success-600">{summary.completed}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Cancelados</p><p className="text-xl font-bold text-danger-600">{summary.cancelled}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Faturamento</p><p className="text-xl font-bold text-success-600">{fmt(summary.revenue)}</p></CardContent></Card>
            </div>
          )}
          {activeReport === 'customers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Total clientes</p><p className="text-xl font-bold text-gray-900">{summary.total}</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Com pets</p><p className="text-xl font-bold text-primary-600">{summary.withPets}</p></CardContent></Card>
            </div>
          )}

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {activeReport === 'sales' && (
                <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">#</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Cliente</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Data</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-right">Total</th>
                </tr></thead><tbody>{data.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-mono">{r.sale_number}</td>
                    <td className="px-6 py-3">{r.customer?.name ?? 'Consumidor final'}</td>
                    <td className="px-6 py-3 text-gray-600">{r.completed_at ? fmtDate(r.completed_at) : '—'}</td>
                    <td className="px-6 py-3 text-right font-medium text-success-600">{fmt(r.total)}</td>
                  </tr>))}</tbody></table>
              )}
              {activeReport === 'financial' && (
                <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Descrição</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Vencimento</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-right">Valor</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                </tr></thead><tbody>{data.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="px-6 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.type === 'income' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>{r.type === 'income' ? 'Receita' : 'Despesa'}</span></td>
                    <td className="px-6 py-3">{r.description}</td>
                    <td className="px-6 py-3 text-gray-600">{r.due_date ? fmtDate(r.due_date) : '—'}</td>
                    <td className={`px-6 py-3 text-right font-medium ${r.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>{fmt(r.amount)}</td>
                    <td className="px-6 py-3 text-gray-600">{r.status === 'paid' ? 'Pago' : r.status === 'pending' ? 'Pendente' : r.status}</td>
                  </tr>))}</tbody></table>
              )}
              {activeReport === 'stock' && (
                <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Produto</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Quantidade</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Mínimo</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                </tr></thead><tbody>{data.map((r: any) => {
                  const isZero = r.quantity === 0; const isLow = !isZero && r.product && r.quantity <= (r.product.minimum_stock ?? 0)
                  return (
                    <tr key={r.id} className="border-b border-gray-50">
                      <td className="px-6 py-3 font-medium">{r.product?.name ?? '—'}</td>
                      <td className={`px-6 py-3 ${isZero ? 'text-danger-600' : isLow ? 'text-warning-600' : ''}`}>{r.quantity} {r.product?.unit ?? 'un'}</td>
                      <td className="px-6 py-3 text-gray-600">{r.product?.minimum_stock ?? 0}</td>
                      <td className="px-6 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isZero ? 'bg-danger-50 text-danger-700' : isLow ? 'bg-warning-50 text-warning-700' : 'bg-success-50 text-success-700'}`}>{isZero ? 'Sem estoque' : isLow ? 'Baixo' : 'Normal'}</span></td>
                    </tr>)})}</tbody></table>
              )}
              {activeReport === 'services' && (
                <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Data</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Serviço</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Profissional</th>
                  <th className="px-6 py-3 font-medium text-gray-500 text-right">Valor</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                </tr></thead><tbody>{data.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 text-gray-600">{fmtDate(r.date)}</td>
                    <td className="px-6 py-3">{r.service?.name ?? '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{r.professional?.name ?? '—'}</td>
                    <td className="px-6 py-3 text-right font-medium">{r.price ? fmt(r.price) : '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{r.status === 'completed' ? 'Concluído' : r.status === 'cancelled' ? 'Cancelado' : r.status === 'scheduled' ? 'Agendado' : r.status}</td>
                  </tr>))}</tbody></table>
              )}
              {activeReport === 'customers' && (
                <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Nome</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Telefone</th>
                  <th className="px-6 py-3 font-medium text-gray-500">E-mail</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Pets</th>
                </tr></thead><tbody>{data.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="px-6 py-3 font-medium">{r.name}</td>
                    <td className="px-6 py-3 text-gray-600">{r.phone ?? '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{r.email ?? '—'}</td>
                    <td className="px-6 py-3">{r.pets?.length ?? 0}</td>
                  </tr>))}</tbody></table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!loading && data.length === 0 && (
        <Card><CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Clique em "Gerar relatório" para visualizar os dados.</p>
        </CardContent></Card>
      )}
    </div>
  )
}
