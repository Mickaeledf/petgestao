import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

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
}

interface Props {
  transaction: Transaction | null
  onClose: () => void
  onSaved: () => void
}

export function FinancialFormDialog({ transaction, onClose, onSaved }: Props) {
  const { currentEstablishment, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [category, setCategory] = useState(transaction?.category ?? '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [dueDate, setDueDate] = useState(transaction?.due_date ?? '')
  const [paidDate, setPaidDate] = useState(transaction?.paid_date ?? '')
  const [status, setStatus] = useState(transaction?.status ?? 'pending')
  const [paymentMethod, setPaymentMethod] = useState(transaction?.payment_method ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!description.trim()) { setError('Informe a descrição.'); return }
    if (!amount || Number(amount) <= 0) { setError('Informe o valor.'); return }
    if (!currentEstablishment) return

    setLoading(true)
    const data = {
      establishment_id: currentEstablishment.id,
      type, description: description.trim(), category: category.trim() || null,
      amount: Number(amount), due_date: dueDate || null, paid_date: paidDate || null,
      status, payment_method: paymentMethod || null, created_by: user?.id,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('financial_transactions') as any
    const result = transaction ? await table.update(data).eq('id', transaction.id) : await table.insert(data)
    setLoading(false)
    if (result.error) { setError(result.error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{transaction ? 'Editar lançamento' : 'Novo lançamento'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tipo *</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === 'income' ? 'bg-success-50 border-success-300 text-success-700' : 'border-gray-300 text-gray-600'}`}>Receita</button>
              <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === 'expense' ? 'bg-danger-50 border-danger-300 text-danger-700' : 'border-gray-300 text-gray-600'}`}>Despesa</button>
            </div>
          </div>
          <Input label="Descrição *" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Aluguel" />
            <Input label="Valor (R$) *" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vencimento" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Input label="Data pagamento" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="pending">Pendente</option><option value="paid">Pago</option><option value="overdue">Vencido</option><option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Forma pgto</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">—</option><option value="dinheiro">Dinheiro</option><option value="pix">PIX</option><option value="credito">Crédito</option><option value="debito">Débito</option><option value="boleto">Boleto</option><option value="transferencia">Transferência</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>{transaction ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
