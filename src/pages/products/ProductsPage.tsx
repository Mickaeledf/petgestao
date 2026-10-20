import { Package, Plus, Search, Tags } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types'
import { ProductFormDialog } from './ProductFormDialog'
import { CategoriesManager } from './CategoriesManager'

export function ProductsPage() {
  const { currentEstablishment } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const loadProducts = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(id, name)')
      .eq('establishment_id', currentEstablishment.id)
      .order('name')
    setProducts((data as unknown as Product[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.internal_code?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase())
  )

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Gerencie os produtos do seu estabelecimento"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowCategories(true)}>
              <Tags className="w-4 h-4" />
              Categorias
            </Button>
            <Button onClick={() => { setEditingProduct(null); setShowForm(true) }}>
              <Plus className="w-4 h-4" />
              Novo produto
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, código ou código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title={search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              description={search ? 'Tente buscar com outros termos.' : 'Cadastre seu primeiro produto para começar.'}
              actionLabel={!search ? 'Cadastrar produto' : undefined}
              onAction={!search ? () => { setEditingProduct(null); setShowForm(true) } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">Nome</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Categoria</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Código</th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Custo</th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Preço</th>
                    <th className="px-6 py-3 font-medium text-gray-500 text-right">Estoque</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditingProduct(product); setShowForm(true) }}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-3 text-gray-600">{product.category?.name ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{product.internal_code ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-600 text-right">{formatCurrency(product.cost_price)}</td>
                      <td className="px-6 py-3 font-medium text-gray-900 text-right">{formatCurrency(product.sale_price)}</td>
                      <td className="px-6 py-3 text-right">
                        <span className={product.minimum_stock > 0 && (product as Product & { stock_balance?: number }).stock_balance !== undefined ? 'text-danger-600' : 'text-gray-600'}>
                          —
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ProductFormDialog
          product={editingProduct}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadProducts() }}
        />
      )}
      {showCategories && (
        <CategoriesManager onClose={() => setShowCategories(false)} />
      )}
    </div>
  )
}
