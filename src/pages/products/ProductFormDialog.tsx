import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Category, Product } from '@/types'

interface Props {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

export function ProductFormDialog({ product, onClose, onSaved }: Props) {
  const { currentEstablishment } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [internalCode, setInternalCode] = useState(product?.internal_code ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'unidade')
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() ?? '0')
  const [salePrice, setSalePrice] = useState(product?.sale_price?.toString() ?? '')
  const [minimumStock, setMinimumStock] = useState(product?.minimum_stock?.toString() ?? '0')
  const [active, setActive] = useState(product?.active ?? true)

  useEffect(() => {
    if (!currentEstablishment) return
    supabase
      .from('categories')
      .select('*')
      .eq('establishment_id', currentEstablishment.id)
      .eq('active', true)
      .order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [currentEstablishment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Informe o nome do produto.')
      return
    }

    if (!salePrice || Number(salePrice) <= 0) {
      setError('Informe um preço de venda válido.')
      return
    }

    if (!currentEstablishment) return

    setLoading(true)

    const data = {
      establishment_id: currentEstablishment.id,
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId || null,
      internal_code: internalCode.trim() || null,
      barcode: barcode.trim() || null,
      brand: brand.trim() || null,
      unit,
      cost_price: Number(costPrice) || 0,
      sale_price: Number(salePrice),
      minimum_stock: Number(minimumStock) || 0,
      active,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('products') as any
    const result = product
      ? await table.update(data).eq('id', product.id)
      : await table.insert(data)

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-0 sm:mx-4">
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {product ? 'Editar produto' : 'Novo produto'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Input label="Código interno" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} />
            <Input label="Código de barras" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            <Input label="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Unidade</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
              >
                <option value="unidade">Unidade</option>
                <option value="kg">Quilograma</option>
                <option value="g">Grama</option>
                <option value="l">Litro</option>
                <option value="ml">Mililitro</option>
                <option value="pacote">Pacote</option>
                <option value="caixa">Caixa</option>
              </select>
            </div>
            <Input label="Custo (R$)" type="number" step="0.01" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            <Input label="Preço de venda (R$) *" type="number" step="0.01" min="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            <Input label="Estoque mínimo" type="number" min="0" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="active" className="text-sm text-gray-700">Produto ativo</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {product ? 'Salvar alterações' : 'Cadastrar produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
