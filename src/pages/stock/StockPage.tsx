import { ArrowDownUp, Box, FileText, Search } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { NfeImportDialog } from './NfeImportDialog'
import { StockAdjustDialog } from './StockAdjustDialog'

interface StockItem {
  id: string
  product_id: string
  quantity: number
  product: { id: string; name: string; unit: string; minimum_stock: number; active: boolean }
}

export function StockPage() {
  const { currentEstablishment } = useAuth()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'zero'>('all')
  const [adjusting, setAdjusting] = useState<StockItem | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [showNfeImport, setShowNfeImport] = useState(false)

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)

    const { data: products } = await supabase
      .from('products')
      .select('id, name, unit, minimum_stock, active')
      .eq('establishment_id', currentEstablishment.id)
      .eq('active', true)
      .order('name')

    const { data: balances } = await supabase
      .from('stock_balances')
      .select('id, product_id, quantity')
      .eq('establishment_id', currentEstablishment.id)

    const balanceMap = new Map((balances ?? []).map((b: any) => [b.product_id, b]))

    const merged: StockItem[] = (products ?? []).map((p: any) => {
      const bal = balanceMap.get(p.id)
      return {
        id: bal?.id ?? p.id,
        product_id: p.id,
        quantity: bal?.quantity ?? 0,
        product: p,
      }
    })

    setItems(merged)
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = items.filter((i) => {
    if (search && !i.product.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'low' && i.quantity >= i.product.minimum_stock) return false
    if (filter === 'zero' && i.quantity > 0) return false
    return true
  })

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(v)
  }

  return (
    <div>
      <PageHeader title="Estoque" description="Controle de estoque e movimentações"
        actions={<Button variant="secondary" onClick={() => setShowNfeImport(true)}><FileText className="w-4 h-4" /> Importar NF-e</Button>} />
      <Card>
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex gap-2">
            {(['all', 'low', 'zero'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border ${filter === f ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {f === 'all' ? 'Todos' : f === 'low' ? 'Estoque baixo' : 'Sem estoque'}
              </button>
            ))}
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Box}
              title={search || filter !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              description="Cadastre produtos para controlar o estoque." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Produto</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-gray-500 text-right">Quantidade</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Unidade</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-gray-500 text-right hidden sm:table-cell">Mínimo</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 sm:px-6 py-3 font-medium text-gray-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const isLow = item.product.minimum_stock > 0 && item.quantity <= item.product.minimum_stock
                    const isZero = item.quantity <= 0
                    return (
                      <tr key={item.product_id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-3 font-medium text-gray-900">{item.product.name}</td>
                        <td className={`px-4 sm:px-6 py-3 text-right font-medium ${isZero ? 'text-danger-600' : isLow ? 'text-warning-600' : 'text-gray-900'}`}>
                          {fmt(item.quantity)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-gray-600 hidden md:table-cell">{item.product.unit}</td>
                        <td className="px-4 sm:px-6 py-3 text-gray-500 text-right hidden sm:table-cell">{fmt(item.product.minimum_stock)}</td>
                        <td className="px-4 sm:px-6 py-3">
                          {isZero ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-700">Sem estoque</span>
                          ) : isLow ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">Estoque baixo</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">Normal</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setAdjusting(item); setShowAdjust(true) }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Ajustar estoque">
                              <ArrowDownUp className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {showAdjust && adjusting && (
        <StockAdjustDialog item={adjusting} onClose={() => setShowAdjust(false)} onSaved={() => { setShowAdjust(false); load() }} />
      )}
      {showNfeImport && (
        <NfeImportDialog onClose={() => setShowNfeImport(false)} onSaved={load} />
      )}
    </div>
  )
}
