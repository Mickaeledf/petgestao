import {
  AlertTriangle,
  ArrowDown,
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  DollarSign,
  Package,
  PawPrint,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip)

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

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
          <p className="text-sm text-gray-500 mt-1">Você precisa estar vinculado a um estabelecimento.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const chartData = {
    labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10'],
    datasets: [{
      label: 'Volume de Atividades',
      data: [25, 45, 75, 40, 75, 30, 38, 65, 90, 15],
      backgroundColor: '#10b981',
      hoverBackgroundColor: '#34d399',
      borderRadius: 6,
      borderSkipped: false as const,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d2822',
        titleColor: '#34d399',
        bodyColor: '#e2e8f0',
        borderColor: '#1a4037',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(26, 64, 55, 0.4)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
    },
  }

  return (
    <div className="space-y-8">

      {/* ===== BANNER DE BOAS-VINDAS ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-800 via-primary-700 to-primary-900 p-6 lg:p-8 shadow-xl border border-primary-700/50">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-200 text-xs font-semibold rounded-full border border-primary-400/30 mb-3">
            Pets felizes, negócios mais fortes
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
            Seu pet shop em boas mãos
          </h1>
          <p className="text-primary-200/70 text-sm md:text-base">
            Organize, acompanhe e faça o seu negócio crescer todos os dias com métricas completas e gestão simplificada.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 lg:opacity-40 pointer-events-none flex items-center justify-end pr-8">
          <ShieldCheck className="w-40 h-40 text-primary-300" />
        </div>
      </div>

      {/* ===== TÍTULO + FILTRO PERÍODO ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Visão geral do negócio • {currentEstablishment.name}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1 text-xs">
          <button className="px-3 py-1.5 rounded-lg bg-primary-600 text-white font-medium shadow-sm">Este mês</button>
          <button className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition">Hoje</button>
          <button className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition">Semana</button>
        </div>
      </div>

      {/* ===== CARDS MÉTRICAS PRINCIPAIS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Vendas hoje / Faturamento" value={fmt(salesToday)}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-primary-500/20 text-primary-500 border-primary-500/30"
          footer="Indicador em dia" footerIcon={<TrendingUp className="w-3 h-3" />} />
        <MetricCard label="Qtd. vendas / Produtos" value={String(salesCount)}
          icon={<ShoppingCart className="w-5 h-5" />}
          iconBg="bg-teal-500/20 text-teal-400 border-teal-500/30"
          footer="Estoque sincronizado" footerIcon={<Package className="w-3 h-3" />} />
        <MetricCard label="Agendamentos hoje" value={String(appointmentsToday)}
          icon={<Scissors className="w-5 h-5" />}
          iconBg="bg-blue-500/20 text-blue-400 border-blue-500/30"
          footer="Agenda atualizada" footerIcon={<Clock className="w-3 h-3" />} />
        <MetricCard label="Ticket Médio" value={fmt(ticketMedio)}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-amber-500/20 text-amber-400 border-amber-500/30"
          footer="Calculado automaticamente" footerIcon={<BarChart3 className="w-3 h-3" />} />
      </div>

      {/* ===== CARDS SECUNDÁRIOS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SecondaryCard label="Clientes ativos" value={String(totalCustomers)}
          icon={<Users className="w-4 h-4" />} iconBg="bg-indigo-500/20 text-indigo-400 border-indigo-500/30" />
        <SecondaryCard label="Pets cadastrados" value={String(totalPets)}
          icon={<PawPrint className="w-4 h-4" />} iconBg="bg-orange-500/20 text-orange-400 border-orange-500/30" />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Contas a pagar</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{fmt(pendingFinancial)}</p>
            {pendingFinancial > 0 && (
              <div className="flex items-center gap-1 mt-1 text-xs text-danger-600">
                <ArrowDown className="w-3 h-3" /><span>Pendente</span>
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ===== GRÁFICO + PAINÉIS LATERAIS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Gráfico Visão Geral */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Visão geral do negócio</h3>
              <p className="text-xs text-gray-500">Desempenho financeiro e operacionais</p>
            </div>
            <span className="text-xs bg-gray-100 text-primary-600 border border-gray-200 px-3 py-1 rounded-lg">
              Este mês
            </span>
          </div>

          <div className="h-64 w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-2 border-t border-gray-200 text-center">
            <SummaryCell label="Receita" value={fmt(salesToday)} />
            <SummaryCell label="Serviços realizados" value={String(appointmentsToday)} />
            <SummaryCell label="Produtos vendidos" value={String(salesCount)} />
            <SummaryCell label="Novos clientes" value={String(totalCustomers)} />
          </div>
        </div>

        {/* Painel Direito */}
        <div className="space-y-8">

          {/* Atividades Recentes */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              Atividades recentes
            </h3>
            <ul className="space-y-3 text-xs">
              <ActivityItem icon={<PawPrint className="w-3.5 h-3.5" />}
                iconBg="bg-primary-500/20 text-primary-400"
                title="Banho e tosa concluído"
                sub={nextAppointments.length > 0 ? `${nextAppointments[0].customer?.name}` : 'Sem registros recentes'} />
              <ActivityItem icon={<UserPlus className="w-3.5 h-3.5" />}
                iconBg="bg-blue-500/20 text-blue-400"
                title="Novo cliente cadastrado"
                sub={totalCustomers > 0 ? `${totalCustomers} clientes ativos` : 'Sem registros recentes'} />
              <ActivityItem icon={<ShoppingBag className="w-3.5 h-3.5" />}
                iconBg="bg-amber-500/20 text-amber-400"
                title="Produto vendido"
                sub={recentSales.length > 0 ? `Última: ${fmt(recentSales[0].total)}` : 'Sem registros recentes'} />
              <ActivityItem icon={<Calendar className="w-3.5 h-3.5" />}
                iconBg="bg-purple-500/20 text-purple-400"
                title="Agendamento realizado"
                sub={appointmentsToday > 0 ? `${appointmentsToday} hoje` : 'Sem registros recentes'} />
            </ul>
          </div>

          {/* Próximos Passos */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary-500" />
              Próximos passos
            </h3>
            <div className="space-y-2 text-xs">
              <CheckItem label="Confirmar agendamentos de amanhã" defaultChecked />
              <CheckItem label="Repor itens em estoque" />
              <CheckItem label="Entrar em contato com clientes inativos" />
              <CheckItem label="Planejar ações do próximo mês" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== TRÊS PAINÉIS DE ALERTAS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Alertas de estoque */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-48 flex flex-col">
          <p className="text-xs font-semibold text-primary-600 mb-2">Alertas de estoque</p>
          {lowStockItems.length === 0 ? (
            <EmptyPanel icon={<Package className="w-5 h-5" />} title="Estoque em dia" sub="Nenhum produto abaixo do limite mínimo" />
          ) : (
            <ul className="space-y-2">
              {lowStockItems.map((it) => (
                <li key={it.id} className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-xs text-gray-700">{it.product?.name}</span>
                  <span className={`text-xs font-medium ${it.quantity === 0 ? 'text-danger-600' : 'text-warning-600'}`}>{it.quantity} un.</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Próximos agendamentos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-48 flex flex-col">
          <p className="text-xs font-semibold text-primary-600 mb-2">Próximos agendamentos</p>
          {nextAppointments.length === 0 ? (
            <EmptyPanel icon={<Calendar className="w-5 h-5" />} title="Nenhum agendamento" sub="A lista para hoje está vazia" />
          ) : (
            <ul className="space-y-2">
              {nextAppointments.map((a: any) => (
                <li key={a.id} className="px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-700">{a.start_time?.slice(0, 5)}</span>
                    <span className="text-[10px] text-gray-500">{a.service?.name ?? 'Serviço'}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{a.customer?.name} — {a.pet?.name}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Últimas vendas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm h-48 flex flex-col">
          <p className="text-xs font-semibold text-primary-600 mb-2">Últimas vendas</p>
          {recentSales.length === 0 ? (
            <EmptyPanel icon={<ShoppingCart className="w-5 h-5" />} title="Nenhuma venda recente" sub="As vendas realizadas aparecerão aqui" />
          ) : (
            <ul className="space-y-2">
              {recentSales.map((s: any) => (
                <li key={s.id} className="flex justify-between items-center px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <div>
                    <span className="text-xs font-medium text-gray-700">#{s.sale_number}</span>
                    <p className="text-[10px] text-gray-500">{s.customer?.name ?? 'Consumidor final'}</p>
                  </div>
                  <span className="text-xs font-semibold text-success-600">{fmt(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/* ===== SUB-COMPONENTES ===== */

function MetricCard({ label, value, icon, iconBg, footer, footerIcon }: {
  label: string; value: string; icon: React.ReactNode; iconBg: string; footer: string; footerIcon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-primary-400/50 transition group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-primary-600">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs text-gray-500 gap-1">
        {footerIcon}
        <span>{footer}</span>
      </div>
    </div>
  )
}

function SecondaryCard({ label, value, icon, iconBg }: {
  label: string; value: string; icon: React.ReactNode; iconBg: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${iconBg}`}>
        {icon}
      </div>
    </div>
  )
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-gray-50">
      <span className="text-[10px] text-gray-500 block">{label}</span>
      <span className="text-xs font-semibold text-primary-600">{value}</span>
    </div>
  )
}

function ActivityItem({ icon, iconBg, title, sub }: {
  icon: React.ReactNode; iconBg: string; title: string; sub: string
}) {
  return (
    <li className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="truncate">
        <p className="font-medium text-gray-700">{title}</p>
        <p className="text-[10px] text-gray-500">{sub}</p>
      </div>
    </li>
  )
}

function CheckItem({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <label className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition">
      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
        className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500 border-gray-300" />
      <span className={`text-gray-700 ${checked ? 'line-through opacity-60' : ''}`}>{label}</span>
    </label>
  )
}

function EmptyPanel({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center my-auto space-y-2 text-center">
      <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mx-auto text-xl border border-primary-100">
        {icon}
      </div>
      <p className="text-xs font-medium text-gray-700">{title}</p>
      <p className="text-[11px] text-gray-500">{sub}</p>
    </div>
  )
}
