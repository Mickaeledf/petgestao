import {
  ArrowLeft,
  Camera,
  DollarSign,
  Minus,
  Percent,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Users,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Scissors,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarcodeScanner } from '@/components/ui/BarcodeScanner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface CartItem {
  product_id: string
  name: string
  unit_price: number
  quantity: number
  total: number
  type: 'product' | 'service'
}

interface Product {
  id: string
  name: string
  sale_price: number
  barcode: string | null
  internal_code: string | null
}

interface Service {
  id: string
  name: string
  price: number
}

interface Customer {
  id: string
  name: string
  phone: string | null
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function PDVPage() {
  const navigate = useNavigate()
  const { currentEstablishment, user } = useAuth()
  const searchRef = useRef<HTMLInputElement>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('Consumidor final')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('dinheiro')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastAdded, setLastAdded] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const [showServices, setShowServices] = useState(false)
  const [showCustomers, setShowCustomers] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [saleComplete, setSaleComplete] = useState(false)
  const [saleNumber, setSaleNumber] = useState<number | null>(null)

  useEffect(() => {
    if (!currentEstablishment) return
    supabase.from('products').select('id, name, sale_price, barcode, internal_code')
      .eq('establishment_id', currentEstablishment.id).eq('active', true).order('name')
      .then(({ data }) => setProducts((data as Product[]) ?? []))
    supabase.from('services').select('id, name, price')
      .eq('establishment_id', currentEstablishment.id).eq('active', true).order('name')
      .then(({ data }) => setServices((data as Service[]) ?? []))
    supabase.from('customers').select('id, name, phone')
      .eq('establishment_id', currentEstablishment.id).eq('status', 'active').order('name')
      .then(({ data }) => setCustomers((data as Customer[]) ?? []))
  }, [currentEstablishment])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const subtotal = cart.reduce((sum, i) => sum + i.total, 0)
  const total = Math.max(0, subtotal - discount)
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  function addProduct(product: Product) {
    const existing = cart.find((i) => i.product_id === product.id && i.type === 'product')
    if (existing) {
      setCart(cart.map((i) => i.product_id === product.id && i.type === 'product'
        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price }
        : i))
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, unit_price: product.sale_price, quantity: 1, total: product.sale_price, type: 'product' }])
    }
    setLastAdded(product.name)
    setSearch('')
    setShowProducts(false)
    searchRef.current?.focus()
  }

  function addService(service: Service) {
    const existing = cart.find((i) => i.product_id === service.id && i.type === 'service')
    if (existing) {
      setCart(cart.map((i) => i.product_id === service.id && i.type === 'service'
        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price }
        : i))
    } else {
      setCart([...cart, { product_id: service.id, name: service.name, unit_price: service.price, quantity: 1, total: service.price, type: 'service' }])
    }
    setLastAdded(service.name)
    setShowServices(false)
    searchRef.current?.focus()
  }

  function updateQty(productId: string, type: string, delta: number) {
    setCart(cart.map((i) => {
      if (i.product_id !== productId || i.type !== type) return i
      const q = Math.max(1, i.quantity + delta)
      return { ...i, quantity: q, total: q * i.unit_price }
    }))
  }

  function removeItem(productId: string, type: string) {
    setCart(cart.filter((i) => !(i.product_id === productId && i.type === type)))
  }

  function handleSearchSubmit() {
    if (!search.trim()) return
    const term = search.trim().toLowerCase()
    const found = products.find((p) =>
      p.barcode === search.trim() ||
      p.internal_code === search.trim() ||
      p.name.toLowerCase() === term
    )
    if (found) {
      addProduct(found)
    } else {
      setShowProducts(true)
    }
  }

  function selectCustomer(c: Customer) {
    setCustomerId(c.id)
    setCustomerName(c.name)
    setShowCustomers(false)
  }

  function clearCustomer() {
    setCustomerId('')
    setCustomerName('Consumidor final')
  }

  function handleCancel() {
    if (cart.length === 0) {
      navigate('/sales')
      return
    }
    if (confirm('Cancelar venda? Todos os itens serão removidos.')) {
      setCart([])
      setDiscount(0)
      setCustomerId('')
      setCustomerName('Consumidor final')
      setLastAdded('')
      setError('')
    }
  }

  async function handleFinalize() {
    if (cart.length === 0) { setError('Adicione ao menos um item.'); return }
    if (!currentEstablishment) return
    setLoading(true)
    setError('')

    const salesTable = supabase.from('sales') as any
    const { data: sale, error: saleErr } = await salesTable.insert({
      establishment_id: currentEstablishment.id,
      customer_id: customerId || null,
      status: 'completed',
      subtotal,
      discount_amount: discount,
      total,
      sold_by: user?.id,
      completed_at: new Date().toISOString(),
    }).select('id, sale_number').single()

    if (saleErr || !sale) { setError(saleErr?.message ?? 'Erro ao criar venda.'); setLoading(false); return }

    const itemsTable = supabase.from('sale_items') as any
    const items = cart.map((i) => ({
      sale_id: sale.id,
      product_id: i.type === 'product' ? i.product_id : null,
      service_id: i.type === 'service' ? i.product_id : null,
      item_type: i.type,
      description: i.name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount: 0,
      total: i.total,
    }))
    await itemsTable.insert(items)

    const paymentsTable = supabase.from('sale_payments') as any
    await paymentsTable.insert({ sale_id: sale.id, method: paymentMethod, amount: total })

    setSaleNumber(sale.sale_number)
    setSaleComplete(true)
    setLoading(false)
  }

  function handleNewSale() {
    setCart([])
    setDiscount(0)
    setCustomerId('')
    setCustomerName('Consumidor final')
    setLastAdded('')
    setError('')
    setPaymentMethod('dinheiro')
    setSaleComplete(false)
    setSaleNumber(null)
    searchRef.current?.focus()
  }

  const filteredProducts = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search) ||
        p.internal_code?.toLowerCase().includes(search.toLowerCase())
      )
    : products

  if (saleComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-primary-800 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="mx-auto w-24 h-24 rounded-full bg-primary-700 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-primary-200" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Venda finalizada!</h1>
            {saleNumber && <p className="text-primary-200 text-lg mt-2">Venda #{saleNumber}</p>}
            <p className="text-4xl font-bold text-white mt-4">{fmt(total)}</p>
            <p className="text-primary-300 mt-2">{paymentMethod === 'dinheiro' ? 'Dinheiro' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'credito' ? 'Cartão de crédito' : paymentMethod === 'debito' ? 'Cartão de débito' : 'Outro'}</p>
            {customerName !== 'Consumidor final' && <p className="text-primary-200 mt-1">{customerName}</p>}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/sales')}
              className="px-6 py-3 rounded-xl bg-primary-700 text-primary-100 hover:bg-primary-600 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-2" />Voltar ao histórico
            </button>
            <button onClick={handleNewSale}
              className="px-6 py-3 rounded-xl bg-white text-primary-800 hover:bg-primary-50 font-bold transition-colors">
              <Plus className="w-4 h-4 inline mr-2" />Nova venda
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-primary-800 text-white px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales')} className="p-1.5 rounded-lg hover:bg-primary-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary-300" />
            <span className="font-bold text-lg tracking-wide">PDV</span>
          </div>
          <span className="text-primary-300 text-sm hidden sm:inline">|</span>
          <span className="text-primary-200 text-sm hidden sm:inline">{currentEstablishment?.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCustomers(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-700/50 hover:bg-primary-700 transition-colors text-sm">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline truncate max-w-[150px]">{customerName}</span>
          </button>
          <div className="flex items-center gap-1.5 text-primary-200 text-sm">
            <User className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{user?.email?.split('@')[0]}</span>
          </div>
        </div>
      </div>

      {/* Last added product banner */}
      <div className="bg-primary-700 text-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {lastAdded ? (
              <p className="text-xl sm:text-2xl font-bold truncate">{lastAdded}</p>
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-primary-300">Leia ou busque um produto</p>
            )}
          </div>
          {lastAdded && cart.length > 0 && (
            <div className="text-right ml-4 shrink-0">
              <p className="text-sm text-primary-200">Último item</p>
              <p className="text-lg font-bold">{fmt(cart[cart.length - 1]?.unit_price ?? 0)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left side - Search + Actions */}
        <div className="lg:w-80 xl:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shrink-0">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Código de barras ou nome..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); if (e.target.value) setShowProducts(true) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
                  onFocus={() => { if (search) setShowProducts(true) }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button onClick={() => setShowScanner(true)}
                className="flex items-center justify-center px-3 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                title="Escanear código de barras">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            {/* Product dropdown */}
            {showProducts && search.trim() && (
              <div className="mt-2 border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto bg-white">
                {filteredProducts.length === 0 ? (
                  <p className="p-3 text-sm text-gray-400 text-center">Nenhum produto encontrado</p>
                ) : filteredProducts.slice(0, 20).map((p) => (
                  <button key={p.id} onClick={() => addProduct(p)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-primary-50 text-left text-sm border-b border-gray-50 last:border-0 transition-colors">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-900 truncate block">{p.name}</span>
                      {p.barcode && <span className="text-xs text-gray-400">{p.barcode}</span>}
                    </div>
                    <span className="text-primary-700 font-semibold ml-2 shrink-0">{fmt(p.sale_price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-3 grid grid-cols-3 gap-2">
            <button onClick={handleCancel}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-gray-200 hover:bg-danger-50 hover:border-danger-300 hover:text-danger-700 text-gray-600 transition-colors text-xs font-medium">
              <XCircle className="w-5 h-5" />
              Cancelar
            </button>
            <button onClick={() => setShowDiscount(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-gray-200 hover:bg-warning-50 hover:border-warning-300 hover:text-warning-700 text-gray-600 transition-colors text-xs font-medium">
              <Percent className="w-5 h-5" />
              Desconto
            </button>
            <button onClick={() => setShowServices(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-gray-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 text-gray-600 transition-colors text-xs font-medium">
              <Scissors className="w-5 h-5" />
              Serviços
            </button>
            <button onClick={() => setShowCustomers(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-gray-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 text-gray-600 transition-colors text-xs font-medium">
              <Users className="w-5 h-5" />
              Cliente
            </button>
            <button onClick={() => { setShowProducts(true); setSearch('') }}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-gray-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 text-gray-600 transition-colors text-xs font-medium">
              <Search className="w-5 h-5" />
              Produtos
            </button>
            <button onClick={() => setShowPayment(true)} disabled={cart.length === 0}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 border-primary-500 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">
              <DollarSign className="w-5 h-5" />
              Concluir
            </button>
          </div>

          {/* Summary on mobile */}
          <div className="lg:hidden p-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</p>
                {discount > 0 && <p className="text-xs text-warning-600">Desc: -{fmt(discount)}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-700">{fmt(total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Items table + Total */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Items table */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 p-8">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Carrinho vazio</p>
                <p className="text-sm mt-1">Busque ou escaneie produtos para adicionar</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left">
                    <th className="px-4 py-2.5 font-medium text-gray-500 w-10">#</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right hidden sm:table-cell">Preço un.</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-center">Qtd</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right">Total</th>
                    <th className="px-4 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, idx) => (
                    <tr key={`${item.product_id}-${item.type}`} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400 sm:hidden">{fmt(item.unit_price)} un.</p>
                        {item.type === 'service' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700 mt-0.5">Serviço</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">{fmt(item.unit_price)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => updateQty(item.product_id, item.type, -1)}
                            className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold w-8 text-center text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, item.type, 1)}
                            className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(item.total)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeItem(item.product_id, item.type)}
                          className="p-1 rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom total bar */}
          <div className="hidden lg:block bg-white border-t border-gray-200 shrink-0">
            {error && (
              <div className="px-4 py-2 bg-danger-50 text-danger-700 text-sm">{error}</div>
            )}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Itens</p>
                  <p className="text-lg font-bold text-gray-900">{itemCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Subtotal</p>
                  <p className="text-lg font-semibold text-gray-700">{fmt(subtotal)}</p>
                </div>
                {discount > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Desconto</p>
                    <p className="text-lg font-semibold text-warning-600">-{fmt(discount)}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total</p>
                  <p className="text-4xl font-bold text-primary-700">{fmt(total)}</p>
                </div>
                <button onClick={() => setShowPayment(true)} disabled={cart.length === 0 || loading}
                  className="px-8 py-4 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg">
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product list modal */}
      {showProducts && !search.trim() && (
        <Modal title="Produtos" onClose={() => setShowProducts(false)}>
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Buscar produto..."
                onChange={(e) => setSearch(e.target.value)} value={search}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[60vh]">
            {filteredProducts.map((p) => (
              <button key={p.id} onClick={() => addProduct(p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 text-left border-b border-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-900 block truncate">{p.name}</span>
                  {p.barcode && <span className="text-xs text-gray-400">{p.barcode}</span>}
                </div>
                <span className="text-primary-700 font-semibold ml-2">{fmt(p.sale_price)}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Services modal */}
      {showServices && (
        <Modal title="Serviços" onClose={() => setShowServices(false)}>
          <div className="overflow-y-auto max-h-[60vh]">
            {services.length === 0 ? (
              <p className="p-6 text-center text-gray-400 text-sm">Nenhum serviço cadastrado</p>
            ) : services.map((s) => (
              <button key={s.id} onClick={() => addService(s)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 text-left border-b border-gray-50 transition-colors">
                <span className="font-medium text-gray-900">{s.name}</span>
                <span className="text-primary-700 font-semibold ml-2">{fmt(s.price)}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Customer modal */}
      {showCustomers && (
        <Modal title="Selecionar cliente" onClose={() => setShowCustomers(false)}>
          <div className="overflow-y-auto max-h-[60vh]">
            <button onClick={() => { clearCustomer(); setShowCustomers(false) }}
              className="w-full flex items-center px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors">
              <span className="text-gray-600">Consumidor final</span>
            </button>
            {customers.map((c) => (
              <button key={c.id} onClick={() => selectCustomer(c)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 text-left border-b border-gray-50 transition-colors">
                <div>
                  <span className="font-medium text-gray-900 block">{c.name}</span>
                  {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                </div>
                {customerId === c.id && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Discount modal */}
      {showDiscount && (
        <Modal title="Desconto" onClose={() => setShowDiscount(false)}>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Valor do desconto (R$)</label>
              <input type="number" step="0.01" min="0" max={subtotal}
                value={discount || ''}
                onChange={(e) => setDiscount(Math.min(subtotal, Number(e.target.value) || 0))}
                className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-xl text-lg text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((pct) => (
                <button key={pct} onClick={() => setDiscount(Math.round(subtotal * pct / 100 * 100) / 100)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors">
                  {pct}%
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-600">Novo total:</span>
              <span className="text-xl font-bold text-primary-700">{fmt(Math.max(0, subtotal - discount))}</span>
            </div>
            <button onClick={() => setShowDiscount(false)}
              className="w-full py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors">
              Aplicar
            </button>
          </div>
        </Modal>
      )}

      {/* Payment modal */}
      {showPayment && (
        <Modal title="Forma de pagamento" onClose={() => setShowPayment(false)}>
          <div className="p-4 space-y-4">
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">Total a pagar</p>
              <p className="text-4xl font-bold text-primary-700">{fmt(total)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                { value: 'pix', label: 'PIX', icon: QrCode },
                { value: 'credito', label: 'Crédito', icon: CreditCard },
                { value: 'debito', label: 'Débito', icon: CreditCard },
              ].map((pm) => (
                <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-colors ${
                    paymentMethod === pm.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                  }`}>
                  <pm.icon className="w-5 h-5" />
                  <span className="font-medium">{pm.label}</span>
                </button>
              ))}
            </div>
            {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
            <button onClick={() => { setShowPayment(false); handleFinalize() }} disabled={loading}
              className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Receipt className="w-5 h-5" />
                  Finalizar venda
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* Barcode scanner */}
      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={(code) => {
            setShowScanner(false)
            const found = products.find((p) => p.barcode === code)
            if (found) addProduct(found)
            else { setSearch(code); setShowProducts(true) }
          }}
        />
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
