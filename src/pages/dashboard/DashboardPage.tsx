import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Scissors,
  TrendingUp,
  Users,
  PawPrint,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface StatCardProps {
  label: string
  value: string
  icon: React.ReactNode
  trend?: { value: string; positive: boolean }
  color: string
}

function StatCard({ label, value, icon, trend, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.positive ? 'text-success-600' : 'text-danger-600'}`}>
              {trend.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }

export function DashboardPage() {
  const { currentEstablishment } = useAuth()
  const [loading, setLoading] = useState(true)
  const [salesToday, setSalesToday] = useState(0)
  const [salesCount, setSalesCount] = useState(0)
  const [appointmentsToday, setAppointmentsToday] = useState(0)
  const [ticketMedio, setTicketMedio] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalPets, setTotalPets] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [nextAppointments, setNextAppointments] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [pendingFinancial, setPendingFinancial] = useState(0)

  useEffect(() => {
    if (!currentEstablishment) { setLoading(false); return }
    const eid = currentEstablishment.id
    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today}T00:00:00`
    const todayEnd = `${today}T23:59:59`

    async function load() {
      setLoading(true)

      const [salesRes, appointRes, custRes, petRes, stockRes, apptListRes, recentSalesRes, financialRes] = await Promise.all([
        supabase.from('sales').select('id, total, status').eq('establishment_id', eid).eq('status', 'completed').gte('completed_at', todayStart).lte('completed_at', todayEnd),
        supabase.from('appointments').select('id').eq('establishment_id', eid).eq('date', today).not('status', 'eq', 'cancelled'),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('establishment_id', eid).eq('status', 'active'),
        supabase.from('pets').select('id', { count: 'exact', head: true }).eq('establishment_id', eid).eq('status', 'active'),
        supabase.from('stock_balances').select('id, quantity, product:products(name, minimum_stock)').eq('establishment_id', eid),
        supabase.from('appointments').select('*, customer:customers(name), pet:pets(name), service:services(name)').eq('establishment_id', eid).eq('date', today).not('status', 'in', '("cancelled","completed")').order('start_time').limit(5),
        supabase.from('sales').select('id, sale_number, total, completed_at, customer:customers(name)').eq('establishment_id', eid).eq('status', 'completed').order('completed_at', { ascending: false }).limit(5),
        supabase.from('financial_transactions').select('id, amount').eq('establishment_id', eid).eq('status', 'pending').eq('type', 'expense'),
      ])

      const sales = (salesRes.data ?? []) as any[]
      const totalSales = sales.reduce((s: number, sl: any) => s + (sl.total ?? 0), 0)
      setSalesToday(totalSales)
      setSalesCount(sales.length)
      setTicketMedio(sales.length > 0 ? totalSales / sales.length : 0)
      setAppointmentsToday((appointRes.data ?? []).length)
      setTotalCustomers(custRes.count ?? 0)
      setTotalPets(petRes.count ?? 0)

      const low = ((stockRes.data ?? []) as any[]).filter((s) => s.product && s.quantity <= (s.product.minimum_stock ?? 0))
      setLowStockItems(low.slice(0, 5))

      setNextAppointments((apptListRes.data ?? []) as any[])
      setRecentSales((recentSalesRes.data ?? []) as any[])
      setPendingFinancial((financialRes.data ?? []).reduce((s: number, t: any) => s + (t.amount ?? 0), 0))

      setLoading(false)
    }
    load()
  }, [currentEstablishment])

  if (!currentEstablishment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900">Nenhum estabelecimento selecionado</h2>
          <p className="text-sm text-gray-500 mt-1">Você precisa estar vinculado a um estabelecimento para acessar o sistema.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description={`Visão geral de ${currentEstablishment.name}`} />
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" description={`Visão geral de ${currentEstablishment.name}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Vendas hoje" value={fmt(salesToday)}
          icon={<DollarSign className="w-6 h-6 text-primary-600" />} color="bg-primary-100" />
        <StatCard label="Qtd. vendas" value={String(salesCount)}
          icon={<ShoppingCart className="w-6 h-6 text-success-600" />} color="bg-success-50" />
        <StatCard label="Agendamentos hoje" value={String(appointmentsToday)}
          icon={<Scissors className="w-6 h-6 text-purple-600" />} color="bg-purple-100" />
        <StatCard label="Ticket médio" value={fmt(ticketMedio)}
          icon={<TrendingUp className="w-6 h-6 text-warning-600" />} color="bg-warning-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Clientes ativos" value={String(totalCustomers)}
          icon={<Users className="w-6 h-6 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Pets cadastrados" value={String(totalPets)}
          icon={<PawPrint className="w-6 h-6 text-amber-600" />} color="bg-amber-50" />
        <StatCard label="Contas a pagar" value={fmt(pendingFinancial)}
          icon={<DollarSign className="w-6 h-6 text-danger-600" />} color="bg-danger-50"
          trend={pendingFinancial > 0 ? { value: 'Pendente', positive: false } : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Alertas de estoque</h3></CardHeader>
          <CardContent className="p-0">
            {lowStockItems.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <div className="text-center"><Package className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Estoque em dia</p></div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {lowStockItems.map((it) => (
                  <li key={it.id} className="px-3 sm:px-3 sm:px-6 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-900">{it.product?.name}</span>
                    <span className={`text-sm font-medium ${it.quantity === 0 ? 'text-danger-600' : 'text-warning-600'}`}>
                      {it.quantity} un.
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Próximos agendamentos</h3></CardHeader>
          <CardContent className="p-0">
            {nextAppointments.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <div className="text-center"><Calendar className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Nenhum agendamento</p></div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {nextAppointments.map((a: any) => (
                  <li key={a.id} className="px-3 sm:px-3 sm:px-6 py-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">{a.start_time?.slice(0, 5)}</span>
                      <span className="text-xs text-gray-500">{a.service?.name ?? 'Serviço'}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{a.customer?.name} — {a.pet?.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Últimas vendas</h3></CardHeader>
          <CardContent className="p-0">
            {recentSales.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <div className="text-center"><ShoppingCart className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Nenhuma venda recente</p></div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentSales.map((s: any) => (
                  <li key={s.id} className="px-3 sm:px-3 sm:px-6 py-3 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-900">#{s.sale_number}</span>
                      <p className="text-xs text-gray-500">{s.customer?.name ?? 'Consumidor final'}</p>
                    </div>
                    <span className="text-sm font-semibold text-success-600">{fmt(s.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
