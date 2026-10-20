import { Minus, Plus, Trash2, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface CartItem {
  product_id: string
  name: string
  unit_price: number
  quantity: number
  total: number
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function NewSaleDialog({ onClose, onSaved }: Props) {
  const { currentEstablishment, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [discount, setDiscount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')

  useEffect(() => {
    if (!currentEstablishment) return
    supabase.from('products').select('id, name, sale_price').eq('establishment_id', currentEstablishment.id).eq('active', true).order('name')
      .then(({ data }) => setProducts(data ?? []))
    supabase.from('customers').select('id, name').eq('establishment_id', currentEstablishment.id).eq('status', 'active').order('name')
      .then(({ data }) => setCustomers(data ?? []))
  }, [currentEstablishment])

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  const subtotal = cart.reduce((sum, i) => sum + i.total, 0)
  const discountAmount = Number(discount) || 0
  const total = Math.max(0, subtotal - discountAmount)

  function addToCart(product: any) {
    const existing = cart.find((i) => i.product_id === product.id)
    if (existing) {
      setCart(cart.map((i) => i.product_id === product.id
        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price }
        : i))
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, unit_price: product.sale_price, quantity: 1, total: product.sale_price }])
    }
  }

  function updateQty(productId: string, delta: number) {
    setCart(cart.map((i) => {
      if (i.product_id !== productId) return i
      const q = Math.max(1, i.quantity + delta)
      return { ...i, quantity: q, total: q * i.unit_price }
    }))
  }

  function removeItem(productId: string) {
    setCart(cart.filter((i) => i.product_id !== productId))
  }

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  async function handleFinalize() {
    if (cart.length === 0) { setError('Adicione ao menos um item.'); return }
    if (!currentEstablishment) return
    setLoading(true)
    setError('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const salesTable = supabase.from('sales') as any
    const { data: sale, error: saleErr } = await salesTable.insert({
      establishment_id: currentEstablishment.id,
      customer_id: customerId || null,
      status: 'completed',
      subtotal,
      discount_amount: discountAmount,
      total,
      sold_by: user?.id,
      completed_at: new Date().toISOString(),
    }).select('id').single()

    if (saleErr || !sale) { setError(saleErr?.message ?? 'Erro ao criar venda.'); setLoading(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsTable = supabase.from('sale_items') as any
    const items = cart.map((i) => ({
      sale_id: sale.id,
      product_id: i.product_id,
      item_type: 'product',
      description: i.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount: 0,
      total: i.total,
    }))
    await itemsTable.insert(items)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentsTable = supabase.from('sale_payments') as any
    await paymentsTable.insert({ sale_id: sale.id, method: paymentMethod, amount: total })

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Nova venda</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="flex-1 overflow-hidden flex">
          {/* Products panel */}
          <div className="w-1/2 border-r border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredProducts.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-left text-sm">
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-gray-600">{fmt(p.sale_price)}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Cart panel */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Consumidor final</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Adicione produtos à venda</p>
              ) : cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-2 px-4 py-2 border-b border-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{fmt(item.unit_price)} un.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product_id, -1)} className="p-1 rounded hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product_id, 1)} className="p-1 rounded hover:bg-gray-100"><Plus className="w-3 h-3" /></button>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-20 text-right">{fmt(item.total)}</span>
                  <button onClick={() => removeItem(item.product_id)} className="p-1 rounded hover:bg-gray-100 text-danger-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 space-y-3">
              {error && <div className="p-2 rounded-lg bg-danger-50 text-danger-700 text-xs">{error}</div>}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 shrink-0">Desconto R$</label>
                <input type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right" />
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{fmt(total)}</span>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Forma de pagamento</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="credito">Cartão de crédito</option>
                  <option value="debito">Cartão de débito</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <Button className="w-full" onClick={handleFinalize} loading={loading} disabled={cart.length === 0}>
                Finalizar venda
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
