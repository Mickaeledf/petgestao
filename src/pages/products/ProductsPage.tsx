import { Camera, Package, Plus, Search, Tags } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { BarcodeScanner } from '@/components/ui/BarcodeScanner'
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
  const [showScanner, setShowScanner] = useState(false)

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
        <div className="px-6 py-7 sm:px-8 border-b border-gray-100">
          <div className="flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center justify-center px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              title="Escanear código de barras"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Carregando…</p>
            </div>
          ) : filtered.length === 0 && search ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto encontrado"
              description="Tente buscar com outros termos."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-6 py-5 font-medium text-gray-500">Nome</th>
                    <th className="px-4 sm:px-6 py-5 font-medium text-gray-500 hidden md:table-cell whitespace-nowrap">Categoria</th>
                    <th className="px-4 sm:px-6 py-5 font-medium text-gray-500 hidden lg:table-cell whitespace-nowrap">Código</th>
                    <th className="px-4 sm:px-6 py-5 font-medium text-gray-500 text-right hidden sm:table-cell whitespace-nowrap">Custo</th>
                    <th className="px-4 sm:px-6 py-5 font-medium text-gray-500 text-right whitespace-nowrap">Preço</th>
                    <th className="px-4 sm:px-6 py-5 font-medium text-gray-500 text-right hidden md:table-cell whitespace-nowrap">Estoque</th>
                    <th className="px-4 sm:px-6 py-5 font-medium text-gray-500 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditingProduct(product); setShowForm(true) }}
                    >
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 hidden md:table-cell">{product.category?.name ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-500 font-mono text-xs hidden lg:table-cell">{product.internal_code ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 text-right hidden sm:table-cell">{formatCurrency(product.cost_price)}</td>
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900 text-right">{formatCurrency(product.sale_price)}</td>
                      <td className="px-4 sm:px-6 py-5 text-right hidden md:table-cell whitespace-nowrap">
                        <span className={product.minimum_stock > 0 && (product as Product & { stock_balance?: number }).stock_balance !== undefined ? 'text-danger-600' : 'text-gray-600'}>
                          —
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  )) : [
                    { name: 'Ração Premium Adulto 15kg', cat: 'Alimentação', code: 'RAC-001', cost: 89.90, price: 149.90, stock: 25 },
                    { name: 'Shampoo Neutro Pet 500ml', cat: 'Higiene', code: 'HIG-012', cost: 12.50, price: 29.90, stock: 40 },
                    { name: 'Coleira Antipulgas M', cat: 'Acessórios', code: 'COL-005', cost: 35.00, price: 69.90, stock: 15 },
                    { name: 'Petisco Dental Cães', cat: 'Petiscos', code: 'PET-008', cost: 8.00, price: 18.90, stock: 60 },
                    { name: 'Tapete Higiênico 30un', cat: 'Higiene', code: 'HIG-020', cost: 22.00, price: 45.90, stock: 30 },
                  ].map((g, i) => (
                    <tr key={i} className="border-b border-gray-50 opacity-40 pointer-events-none select-none">
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{g.name}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 hidden md:table-cell">{g.cat}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-500 font-mono text-xs hidden lg:table-cell">{g.code}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 text-right hidden sm:table-cell">{formatCurrency(g.cost)}</td>
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900 text-right">{formatCurrency(g.price)}</td>
                      <td className="px-4 sm:px-6 py-5 text-right hidden md:table-cell whitespace-nowrap">{g.stock}</td>
                      <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">Ativo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-3">Os dados acima são exemplos. Cadastre seus produtos reais.</p>
                  <Button onClick={() => { setEditingProduct(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Cadastrar produto</Button>
                </div>
              )}
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
      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onScan={(code) => {
            setShowScanner(false)
            setSearch(code)
            const found = products.find((p) => p.barcode === code)
            if (found) {
              setEditingProduct(found)
              setShowForm(true)
            }
          }}
        />
      )}
    </div>
  )
}
