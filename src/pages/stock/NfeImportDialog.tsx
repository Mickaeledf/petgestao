import { FileText, Upload, X, Check, AlertTriangle, Package } from 'lucide-react'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface NfeProduct {
  nItem: string
  cEAN: string
  xProd: string
  uCom: string
  qCom: number
  vUnCom: number
  vProd: number
  matched?: { id: string; name: string } | null
}

interface NfeInfo {
  numero: string
  serie: string
  dataEmissao: string
  emitente: string
  cnpjEmitente: string
  valorTotal: number
  produtos: NfeProduct[]
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

function parseNfeXml(xmlText: string): NfeInfo {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  const ns = doc.documentElement.namespaceURI || ''
  const sel = (parent: Element | Document, tag: string) => {
    const el = ns
      ? parent.getElementsByTagNameNS(ns, tag)[0]
      : parent.getElementsByTagName(tag)[0]
    return el?.textContent?.trim() ?? ''
  }

  const ide = ns ? doc.getElementsByTagNameNS(ns, 'ide')[0] : doc.getElementsByTagName('ide')[0]
  const emit = ns ? doc.getElementsByTagNameNS(ns, 'emit')[0] : doc.getElementsByTagName('emit')[0]
  const total = ns ? doc.getElementsByTagNameNS(ns, 'ICMSTot')[0] : doc.getElementsByTagName('ICMSTot')[0]

  const detEls = ns ? doc.getElementsByTagNameNS(ns, 'det') : doc.getElementsByTagName('det')

  const produtos: NfeProduct[] = []
  for (let i = 0; i < detEls.length; i++) {
    const det = detEls[i]
    const prod = ns ? det.getElementsByTagNameNS(ns, 'prod')[0] : det.getElementsByTagName('prod')[0]
    if (!prod) continue

    const cEAN = sel(prod, 'cEAN')
    produtos.push({
      nItem: det.getAttribute('nItem') ?? String(i + 1),
      cEAN: cEAN === 'SEM GTIN' ? '' : cEAN,
      xProd: sel(prod, 'xProd'),
      uCom: sel(prod, 'uCom'),
      qCom: parseFloat(sel(prod, 'qCom')) || 0,
      vUnCom: parseFloat(sel(prod, 'vUnCom')) || 0,
      vProd: parseFloat(sel(prod, 'vProd')) || 0,
    })
  }

  return {
    numero: ide ? sel(ide, 'nNF') : '',
    serie: ide ? sel(ide, 'serie') : '',
    dataEmissao: ide ? sel(ide, 'dhEmi').substring(0, 10) : '',
    emitente: emit ? (sel(emit, 'xFant') || sel(emit, 'xNome')) : '',
    cnpjEmitente: emit ? sel(emit, 'CNPJ') : '',
    valorTotal: total ? parseFloat(sel(total, 'vNF')) || 0 : 0,
    produtos,
  }
}

export function NfeImportDialog({ onClose, onSaved }: Props) {
  const { currentEstablishment, user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload')
  const [nfe, setNfe] = useState<NfeInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [imported, setImported] = useState(0)

  function fmt(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')

    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Selecione um arquivo XML de NF-e.')
      return
    }

    try {
      const text = await file.text()
      const parsed = parseNfeXml(text)

      if (parsed.produtos.length === 0) {
        setError('Nenhum produto encontrado no XML. Verifique se é um arquivo de NF-e válido.')
        return
      }

      if (!currentEstablishment) return
      const { data: products } = await supabase
        .from('products')
        .select('id, name, barcode')
        .eq('establishment_id', currentEstablishment.id)

      for (const nfeProd of parsed.produtos) {
        if (nfeProd.cEAN && products) {
          const match = (products as any[]).find((p) => p.barcode === nfeProd.cEAN)
          if (match) {
            nfeProd.matched = { id: match.id, name: match.name }
          }
        }
      }

      setNfe(parsed)
      setSelected(new Set(parsed.produtos.map((_, i) => i)))
      setStep('review')
    } catch {
      setError('Erro ao ler o arquivo XML. Verifique se é um arquivo válido.')
    }
  }

  async function handleImport() {
    if (!nfe || !currentEstablishment || !user) return
    setLoading(true)
    setError('')

    let count = 0

    for (const idx of selected) {
      const prod = nfe.produtos[idx]
      let productId = prod.matched?.id

      if (!productId) {
        const { data: newProd, error: prodErr } = await (supabase.from('products') as any).insert({
          establishment_id: currentEstablishment.id,
          name: prod.xProd,
          barcode: prod.cEAN || null,
          unit: prod.uCom.toLowerCase() === 'un' ? 'unidade' : prod.uCom,
          cost_price: prod.vUnCom,
          sale_price: Math.round(prod.vUnCom * 1.5 * 100) / 100,
          minimum_stock: 1,
        }).select('id').single()

        if (prodErr) {
          setError(`Erro ao criar produto "${prod.xProd}": ${prodErr.message}`)
          setLoading(false)
          return
        }
        productId = newProd.id
      }

      await (supabase.from('stock_movements') as any).insert({
        establishment_id: currentEstablishment.id,
        product_id: productId,
        movement_type: 'purchase',
        quantity: prod.qCom,
        reason: `NF-e ${nfe.numero} - ${nfe.emitente}`,
        created_by: user.id,
      })

      const { data: existing } = await (supabase.from('stock_balances') as any)
        .select('id, quantity')
        .eq('establishment_id', currentEstablishment.id)
        .eq('product_id', productId)
        .maybeSingle()

      if (existing) {
        await (supabase.from('stock_balances') as any)
          .update({ quantity: existing.quantity + prod.qCom })
          .eq('id', existing.id)
      } else {
        await (supabase.from('stock_balances') as any).insert({
          establishment_id: currentEstablishment.id,
          product_id: productId,
          quantity: prod.qCom,
        })
      }

      count++
    }

    setImported(count)
    setStep('done')
    setLoading(false)
  }

  function toggleItem(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-0 sm:mx-4">
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Importar NF-e</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}

          {step === 'upload' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">Selecione o XML da NF-e</h3>
                <p className="text-sm text-gray-500 mt-1">
                  O arquivo XML da nota fiscal eletrônica será lido para importar os produtos ao estoque.
                </p>
              </div>
              <input ref={fileRef} type="file" accept=".xml" onChange={handleFile} className="hidden" />
              <Button onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4" /> Selecionar arquivo XML
              </Button>
            </div>
          )}

          {step === 'review' && nfe && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 text-sm space-y-2">
                <p><span className="text-gray-500">NF-e:</span> <span className="font-medium">{nfe.numero}</span> <span className="text-gray-400">Série {nfe.serie}</span></p>
                <p><span className="text-gray-500">Emitente:</span> <span className="font-medium">{nfe.emitente}</span></p>
                {nfe.dataEmissao && <p><span className="text-gray-500">Data:</span> {new Date(nfe.dataEmissao + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
                <p><span className="text-gray-500">Total:</span> <span className="font-medium">{fmt(nfe.valorTotal)}</span></p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">{nfe.produtos.length} produtos encontrados</h3>
                  <button
                    onClick={() => setSelected(selected.size === nfe.produtos.length ? new Set() : new Set(nfe.produtos.map((_, i) => i)))}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    {selected.size === nfe.produtos.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[40vh] overflow-y-auto">
                  {nfe.produtos.map((prod, idx) => (
                    <label key={idx} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selected.has(idx)} onChange={() => toggleItem(idx)}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{prod.xProd}</p>
                        <p className="text-xs text-gray-500">
                          {prod.qCom} {prod.uCom} x {fmt(prod.vUnCom)} = {fmt(prod.vProd)}
                          {prod.cEAN && <span className="ml-2 text-gray-400">EAN: {prod.cEAN}</span>}
                        </p>
                        {prod.matched ? (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-success-700 bg-success-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Vinculado: {prod.matched.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs text-warning-700 bg-warning-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Novo produto será criado
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="secondary" onClick={() => { setStep('upload'); setNfe(null) }}>Voltar</Button>
                <Button onClick={handleImport} loading={loading} disabled={selected.size === 0}>
                  <Package className="w-4 h-4" /> Importar {selected.size} {selected.size === 1 ? 'item' : 'itens'}
                </Button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-success-50 flex items-center justify-center">
                <Check className="w-8 h-8 text-success-600" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">Importação concluída!</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {imported} {imported === 1 ? 'produto importado' : 'produtos importados'} com sucesso da NF-e {nfe?.numero}.
                </p>
              </div>
              <Button onClick={() => { onSaved(); onClose() }}>Fechar</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
