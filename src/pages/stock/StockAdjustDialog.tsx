import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface StockItem {
  product_id: string
  quantity: number
  product: { name: string }
}

interface Props {
  item: StockItem
  onClose: () => void
  onSaved: () => void
}

const MOVEMENT_TYPES = [
  { value: 'adjustment_positive', label: 'Entrada (ajuste positivo)' },
  { value: 'adjustment_negative', label: 'Saída (ajuste negativo)' },
  { value: 'initial', label: 'Estoque inicial' },
  { value: 'purchase', label: 'Compra' },
  { value: 'loss', label: 'Perda' },
  { value: 'expiry', label: 'Vencimento' },
  { value: 'internal_use', label: 'Uso interno' },
  { value: 'correction', label: 'Correção' },
] as const

export function StockAdjustDialog({ item, onClose, onSaved }: Props) {
  const { currentEstablishment } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [movementType, setMovementType] = useState('adjustment_positive')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const isPositive = ['adjustment_positive', 'initial', 'purchase', 'return_customer', 'correction'].includes(movementType)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const qty = Number(quantity)
    if (!qty || qty <= 0) { setError('Informe uma quantidade válida.'); return }
    if (!currentEstablishment) return

    setLoading(true)

    const actualQty = isPositive ? qty : -qty

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const movTable = supabase.from('stock_movements') as any
    const { error: movError } = await movTable.insert({
      establishment_id: currentEstablishment.id,
      product_id: item.product_id,
      movement_type: movementType,
      quantity: actualQty,
      reason: reason.trim() || null,
    })

    if (movError) { setError(movError.message); setLoading(false); return }

    const newQty = item.quantity + actualQty

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const balTable = supabase.from('stock_balances') as any
    const { data: existing } = await balTable
      .select('id')
      .eq('establishment_id', currentEstablishment.id)
      .eq('product_id', item.product_id)
      .maybeSingle()

    if (existing) {
      await balTable.update({ quantity: newQty }).eq('id', existing.id)
    } else {
      await balTable.insert({
        establishment_id: currentEstablishment.id,
        product_id: item.product_id,
        quantity: newQty,
      })
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Ajustar estoque</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-600">Produto: <span className="font-medium text-gray-900">{item.product.name}</span></p>
            <p className="text-sm text-gray-600">Estoque atual: <span className="font-medium text-gray-900">{item.quantity}</span></p>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tipo de movimentação *</label>
            <select value={movementType} onChange={(e) => setMovementType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {MOVEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="Quantidade *" type="number" step="0.001" min="0.001" value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            helpText={isPositive ? 'Será adicionado ao estoque' : 'Será removido do estoque'} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Motivo</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {quantity && Number(quantity) > 0 && (
            <div className="p-3 rounded-lg bg-primary-50 text-sm">
              Novo estoque: <span className="font-bold">{(item.quantity + (isPositive ? Number(quantity) : -Number(quantity))).toFixed(3)}</span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>Confirmar ajuste</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
