import { X, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface PurchaseItem {
  id?: string
  product_id?: string | null
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Props {
  purchase: any | null
  onClose: () => void
  onSaved: () => void
}

export function PurchaseFormDialog({ purchase, onClose, onSaved }: Props) {
  const { currentEstablishment, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [supplierId, setSupplierId] = useState(purchase?.supplier_id ?? '')
  const [status, setStatus] = useState(purchase?.status ?? 'pending')
  const [expectedDate, setExpectedDate] = useState(purchase?.expected_date ?? '')
  const [notes, setNotes] = useState(purchase?.notes ?? '')
  const [items, setItems] = useState<PurchaseItem[]>([])

  useEffect(() => {
    if (!currentEstablishment) return
    const eid = currentEstablishment.id
    supabase.from('suppliers').select('id, name').eq('establishment_id', eid).eq('active', true).order('name').then(({ data }) => setSuppliers(data ?? []))
    supabase.from('products').select('id, name, cost_price').eq('establishment_id', eid).eq('active', true).order('name').then(({ data }) => setProducts(data ?? []))
  }, [currentEstablishment])

  useEffect(() => {
    if (!purchase) return
    supabase.from('purchase_items').select('*').eq('purchase_id', purchase.id).then(({ data }) => {
      if (data) setItems(data.map((d: any) => ({ ...d, total: d.quantity * d.unit_price })))
    })
  }, [purchase])

  function addProductItem(pId: string) {
    const prod = products.find((p) => p.id === pId)
    if (!prod) return
    setItems([...items, { product_id: pId, description: prod.name, quantity: 1, unit_price: prod.cost_price ?? 0, total: prod.cost_price ?? 0 }])
  }

  function updateItem(idx: number, field: string, value: any) {
    const updated = [...items]
    ;(updated[idx] as any)[field] = value
    updated[idx].total = updated[idx].quantity * updated[idx].unit_price
    setItems(updated)
  }

  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)) }

  const grandTotal = items.reduce((s, it) => s + it.total, 0)

  function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (items.length === 0) { setError('Adicione ao menos um item.'); return }
    if (!currentEstablishment) return

    setLoading(true)
    const purchaseData = {
      establishment_id: currentEstablishment.id,
      supplier_id: supplierId || null,
      status, expected_date: expectedDate || null,
      notes: notes.trim() || null, total: grandTotal,
      created_by: user?.id,
    }

    const table = supabase.from('purchases') as any
    let purchaseId: string

    if (purchase) {
      const { error: err } = await table.update(purchaseData).eq('id', purchase.id)
      if (err) { setError(err.message); setLoading(false); return }
      purchaseId = purchase.id
      await (supabase.from('purchase_items') as any).delete().eq('purchase_id', purchaseId)
    } else {
      const { data, error: err } = await table.insert(purchaseData).select('id').single()
      if (err) { setError(err.message); setLoading(false); return }
      purchaseId = data.id
    }

    if (items.length > 0) {
      const itemsData = items.map((it) => ({
        purchase_id: purchaseId, product_id: it.product_id || null,
        description: it.description, quantity: it.quantity,
        unit_price: it.unit_price, total: it.total,
      }))
      await (supabase.from('purchase_items') as any).insert(itemsData)
    }

    setLoading(false); onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 overflow-y-auto p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-0 sm:mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{purchase ? `Compra #${purchase.purchase_number}` : 'Nova Compra'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Selecione...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Input label="Previsão entrega" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            {purchase && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="pending">Pendente</option><option value="received">Recebido</option>
                  <option value="partial">Parcial</option><option value="cancelled">Cancelado</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Itens</h3>
              <select onChange={(e) => { if (e.target.value) addProductItem(e.target.value); e.target.value = '' }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs">
                <option value="">+ Adicionar produto</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {items.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">Adicione produtos à compra</p>
            ) : (
              <table className="w-full text-sm mb-3"><thead><tr className="border-b border-gray-100 text-left">
                <th className="py-2 font-medium text-gray-500">Produto</th>
                <th className="py-2 font-medium text-gray-500 w-20">Qtd</th>
                <th className="py-2 font-medium text-gray-500 w-28">Custo unit.</th>
                <th className="py-2 font-medium text-gray-500 text-right w-24">Total</th>
                <th className="py-2 w-10" />
              </tr></thead><tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{it.description}</td>
                    <td className="py-2"><input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value) || 1)} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2"><input type="number" step="0.01" min="0" value={it.unit_price} onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value) || 0)} className="w-24 px-2 py-1 border border-gray-200 rounded text-sm" /></td>
                    <td className="py-2 text-right font-medium text-gray-900">{fmt(it.total)}</td>
                    <td className="py-2"><button type="button" onClick={() => removeItem(i)} className="p-1 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-gray-400" /></button></td>
                  </tr>
                ))}
              </tbody></table>
            )}
            <div className="text-right font-semibold text-gray-900">Total: {fmt(grandTotal)}</div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>{purchase ? 'Salvar' : 'Registrar compra'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
