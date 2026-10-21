import { X, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface OrderItem {
  id?: string
  item_type: 'service' | 'product'
  service_id?: string | null
  product_id?: string | null
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Props {
  order: any | null
  onClose: () => void
  onSaved: () => void
}

export function ServiceOrderFormDialog({ order, onClose, onSaved }: Props) {
  const { currentEstablishment, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [pets, setPets] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  const [customerId, setCustomerId] = useState(order?.customer_id ?? '')
  const [petId, setPetId] = useState(order?.pet_id ?? '')
  const [professionalId, setProfessionalId] = useState(order?.professional_id ?? '')
  const [status, setStatus] = useState(order?.status ?? 'pending')
  const [checkinNotes, setCheckinNotes] = useState(order?.checkin_notes ?? '')
  const [checkoutNotes, setCheckoutNotes] = useState(order?.checkout_notes ?? '')
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    if (!currentEstablishment) return
    const eid = currentEstablishment.id
    supabase.from('customers').select('id, name').eq('establishment_id', eid).eq('status', 'active').order('name').then(({ data }) => setCustomers(data ?? []))
    supabase.from('professionals').select('id, name').eq('establishment_id', eid).eq('active', true).order('name').then(({ data }) => setProfessionals(data ?? []))
    supabase.from('services').select('id, name, base_price').eq('establishment_id', eid).eq('active', true).order('name').then(({ data }) => setServices(data ?? []))
    supabase.from('products').select('id, name, sale_price').eq('establishment_id', eid).eq('active', true).order('name').then(({ data }) => setProducts(data ?? []))
  }, [currentEstablishment])

  useEffect(() => {
    if (!customerId || !currentEstablishment) { setPets([]); return }
    supabase.from('pets').select('id, name').eq('establishment_id', currentEstablishment.id).eq('customer_id', customerId).eq('status', 'active').order('name').then(({ data }) => setPets(data ?? []))
  }, [customerId, currentEstablishment])

  useEffect(() => {
    if (!order) return
    supabase.from('service_order_items').select('*').eq('service_order_id', order.id).then(({ data }) => {
      if (data) setItems(data.map((d: any) => ({ ...d, total: d.quantity * d.unit_price })))
    })
  }, [order])

  function addServiceItem(sId: string) {
    const svc = services.find((s) => s.id === sId)
    if (!svc) return
    setItems([...items, { item_type: 'service', service_id: sId, description: svc.name, quantity: 1, unit_price: svc.base_price, total: svc.base_price }])
  }

  function addProductItem(pId: string) {
    const prod = products.find((p) => p.id === pId)
    if (!prod) return
    setItems([...items, { item_type: 'product', product_id: pId, description: prod.name, quantity: 1, unit_price: prod.sale_price, total: prod.sale_price }])
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
    if (!customerId) { setError('Selecione o cliente.'); return }
    if (!petId) { setError('Selecione o pet.'); return }
    if (!currentEstablishment) return

    setLoading(true)
    const orderData = {
      establishment_id: currentEstablishment.id,
      customer_id: customerId, pet_id: petId,
      professional_id: professionalId || null,
      status, checkin_notes: checkinNotes.trim() || null,
      checkout_notes: checkoutNotes.trim() || null,
      total: grandTotal, created_by: user?.id,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('service_orders') as any
    let orderId: string

    if (order) {
      const { error: err } = await table.update(orderData).eq('id', order.id)
      if (err) { setError(err.message); setLoading(false); return }
      orderId = order.id
      await (supabase.from('service_order_items') as any).delete().eq('service_order_id', orderId)
    } else {
      const { data, error: err } = await table.insert(orderData).select('id').single()
      if (err) { setError(err.message); setLoading(false); return }
      orderId = data.id
    }

    if (items.length > 0) {
      const itemsData = items.map((it) => ({
        service_order_id: orderId, item_type: it.item_type,
        service_id: it.service_id || null, product_id: it.product_id || null,
        description: it.description, quantity: it.quantity,
        unit_price: it.unit_price, total: it.total,
      }))
      await (supabase.from('service_order_items') as any).insert(itemsData)
    }

    setLoading(false); onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 overflow-y-auto p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-0 sm:mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{order ? `OS #${order.order_number}` : 'Nova Ordem de Serviço'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Cliente *</label>
              <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPetId('') }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Selecione...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Pet *</label>
              <select value={petId} onChange={(e) => setPetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" disabled={!customerId}>
                <option value="">Selecione...</option>
                {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Profissional</label>
              <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Qualquer</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {order && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="pending">Pendente</option><option value="in_progress">Em andamento</option>
                <option value="completed">Concluído</option><option value="delivered">Entregue</option><option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Observações check-in</label>
            <textarea value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} rows={2} placeholder="Estado do pet na entrada..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {order && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Observações check-out</label>
              <textarea value={checkoutNotes} onChange={(e) => setCheckoutNotes(e.target.value)} rows={2} placeholder="Observações na saída..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Itens</h3>
              <div className="flex gap-2">
                <select onChange={(e) => { if (e.target.value) addServiceItem(e.target.value); e.target.value = '' }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs">
                  <option value="">+ Serviço</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select onChange={(e) => { if (e.target.value) addProductItem(e.target.value); e.target.value = '' }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs">
                  <option value="">+ Produto</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">Adicione serviços ou produtos</p>
            ) : (
              <table className="w-full text-sm mb-3"><thead><tr className="border-b border-gray-100 text-left">
                <th className="py-2 font-medium text-gray-500">Tipo</th>
                <th className="py-2 font-medium text-gray-500">Descrição</th>
                <th className="py-2 font-medium text-gray-500 w-20">Qtd</th>
                <th className="py-2 font-medium text-gray-500 w-28">Unit.</th>
                <th className="py-2 font-medium text-gray-500 text-right w-24">Total</th>
                <th className="py-2 w-10" />
              </tr></thead><tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2"><span className={`text-xs font-medium px-1.5 py-0.5 rounded ${it.item_type === 'service' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>{it.item_type === 'service' ? 'Serviço' : 'Produto'}</span></td>
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
            <Button type="submit" loading={loading}>{order ? 'Salvar' : 'Criar OS'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
