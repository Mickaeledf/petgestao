import { Lock, Unlock } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface CashRegister {
  id: string
  status: 'open' | 'closed'
  opening_balance: number
  closing_balance: number | null
  opened_at: string
  closed_at: string | null
}

interface CashMovement {
  id: string
  movement_type: string
  amount: number
  description: string | null
  created_at: string
}

export function CashRegisterPage() {
  const { currentEstablishment, user } = useAuth()
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [openingBalance, setOpeningBalance] = useState('0')
  const [closingBalance, setClosingBalance] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDesc, setWithdrawDesc] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositDesc, setDepositDesc] = useState('')
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('cash_registers')
      .select('*')
      .eq('establishment_id', currentEstablishment.id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const register = data as CashRegister | null
    setCurrentRegister(register)

    if (register) {
      const { data: movs } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('cash_register_id', register.id)
        .order('created_at', { ascending: false })
      setMovements((movs as CashMovement[]) ?? [])
    }
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  async function openRegister() {
    if (!currentEstablishment || !user) return
    setActionLoading(true); setError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('cash_registers') as any
    const { data, error: err } = await table.insert({
      establishment_id: currentEstablishment.id, opened_by: user.id, status: 'open', opening_balance: Number(openingBalance) || 0,
    }).select('id').single()
    if (err) { setError(err.message); setActionLoading(false); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movTable = supabase.from('cash_movements') as any
    await movTable.insert({ cash_register_id: data.id, movement_type: 'opening', amount: Number(openingBalance) || 0, description: 'Abertura de caixa', created_by: user.id })
    setActionLoading(false); load()
  }

  async function closeRegister() {
    if (!currentRegister || !user) return
    setActionLoading(true); setError('')
    const closeBal = Number(closingBalance) || 0
    const totalIn = movements.filter((m) => m.amount > 0).reduce((s, m) => s + m.amount, 0)
    const totalOut = movements.filter((m) => m.amount < 0).reduce((s, m) => s + m.amount, 0)
    const expected = currentRegister.opening_balance + totalIn + totalOut
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('cash_registers') as any
    await table.update({ status: 'closed', closing_balance: closeBal, expected_balance: expected, difference: closeBal - expected, closed_by: user.id, closed_at: new Date().toISOString() }).eq('id', currentRegister.id)
    setActionLoading(false); setClosingBalance(''); load()
  }

  async function addMovement(type: 'withdrawal' | 'deposit') {
    if (!currentRegister || !user) return
    const amount = type === 'withdrawal' ? Number(withdrawAmount) : Number(depositAmount)
    const desc = type === 'withdrawal' ? withdrawDesc : depositDesc
    if (!amount || amount <= 0) { setError('Informe um valor válido.'); return }
    setActionLoading(true); setError('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('cash_movements') as any
    await table.insert({ cash_register_id: currentRegister.id, movement_type: type, amount: type === 'withdrawal' ? -amount : amount, description: desc.trim() || null, created_by: user.id })
    setWithdrawAmount(''); setWithdrawDesc(''); setDepositAmount(''); setDepositDesc('')
    setActionLoading(false); load()
  }

  const movTypeLabel: Record<string, string> = { opening: 'Abertura', sale: 'Venda', withdrawal: 'Retirada', deposit: 'Suprimento', expense: 'Despesa' }

  if (loading) {
    return (<div><PageHeader title="Caixa" description="Controle de caixa" />
      <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div></div>)
  }

  return (
    <div>
      <PageHeader title="Caixa" description="Abertura, movimentações e fechamento" />
      {error && <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
      {!currentRegister ? (
        <Card><CardContent className="p-8 text-center space-y-4">
          <Unlock className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900">Caixa fechado</h3>
          <p className="text-sm text-gray-600">Abra o caixa para registrar vendas e movimentações.</p>
          <div className="max-w-xs mx-auto"><Input label="Valor inicial (R$)" type="number" step="0.01" min="0" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} /></div>
          <Button onClick={openRegister} loading={actionLoading}><Unlock className="w-4 h-4" /> Abrir caixa</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Saldo inicial</p><p className="text-xl font-bold text-gray-900">{fmt(currentRegister.opening_balance)}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Entradas</p><p className="text-xl font-bold text-success-600">{fmt(movements.filter((m) => m.amount > 0 && m.movement_type !== 'opening').reduce((s, m) => s + m.amount, 0))}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-gray-500 uppercase">Saídas</p><p className="text-xl font-bold text-danger-600">{fmt(Math.abs(movements.filter((m) => m.amount < 0).reduce((s, m) => s + m.amount, 0)))}</p></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader><h3 className="font-semibold text-gray-900">Retirada</h3></CardHeader>
              <CardContent className="space-y-3"><Input label="Valor" type="number" step="0.01" min="0" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                <Input label="Descrição" value={withdrawDesc} onChange={(e) => setWithdrawDesc(e.target.value)} />
                <Button variant="danger" onClick={() => addMovement('withdrawal')} loading={actionLoading} disabled={!withdrawAmount}>Retirar</Button></CardContent></Card>
            <Card><CardHeader><h3 className="font-semibold text-gray-900">Suprimento</h3></CardHeader>
              <CardContent className="space-y-3"><Input label="Valor" type="number" step="0.01" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                <Input label="Descrição" value={depositDesc} onChange={(e) => setDepositDesc(e.target.value)} />
                <Button onClick={() => addMovement('deposit')} loading={actionLoading} disabled={!depositAmount}>Depositar</Button></CardContent></Card>
          </div>
          <Card><CardHeader><h3 className="font-semibold text-gray-900">Movimentações</h3></CardHeader>
            <CardContent className="p-0">
              {movements.length === 0 ? <p className="text-center text-gray-400 py-6 text-sm">Nenhuma movimentação</p> : (
                <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Tipo</th><th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Descrição</th>
                  <th className="px-4 sm:px-6 py-3 font-medium text-gray-500 text-right">Valor</th><th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Hora</th>
                </tr></thead><tbody>{movements.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-gray-600">{movTypeLabel[m.movement_type] ?? m.movement_type}</td>
                    <td className="px-4 sm:px-6 py-3 text-gray-600">{m.description ?? '—'}</td>
                    <td className={`px-4 sm:px-6 py-3 font-medium text-right ${m.amount >= 0 ? 'text-success-600' : 'text-danger-600'}`}>{m.amount >= 0 ? '+' : ''}{fmt(m.amount)}</td>
                    <td className="px-4 sm:px-6 py-3 text-gray-500 text-xs">{fmtDate(m.created_at)}</td>
                  </tr>))}</tbody></table>)}
            </CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-4">
            <Input label="Valor em caixa (contagem)" type="number" step="0.01" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} />
            <Button variant="danger" onClick={closeRegister} loading={actionLoading} disabled={!closingBalance}><Lock className="w-4 h-4" /> Fechar caixa</Button>
          </CardContent></Card>
        </div>
      )}
    </div>
  )
}
