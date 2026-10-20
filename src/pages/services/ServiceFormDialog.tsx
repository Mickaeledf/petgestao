import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/types'

interface Props {
  service: Service | null
  onClose: () => void
  onSaved: () => void
}

export function ServiceFormDialog({ service, onClose, onSaved }: Props) {
  const { currentEstablishment } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(service?.name ?? '')
  const [description, setDescription] = useState(service?.description ?? '')
  const [basePrice, setBasePrice] = useState(service?.base_price?.toString() ?? '')
  const [durationMinutes, setDurationMinutes] = useState(service?.duration_minutes?.toString() ?? '60')
  const [active, setActive] = useState(service?.active ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Informe o nome do serviço.'); return }
    if (!basePrice || Number(basePrice) < 0) { setError('Informe um preço base válido.'); return }
    if (!durationMinutes || Number(durationMinutes) <= 0) { setError('Informe a duração.'); return }
    if (!currentEstablishment) return

    setLoading(true)
    const data = {
      establishment_id: currentEstablishment.id,
      name: name.trim(),
      description: description.trim() || null,
      base_price: Number(basePrice),
      duration_minutes: Number(durationMinutes),
      active,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('services') as any
    const result = service ? await table.update(data).eq('id', service.id) : await table.insert(data)
    setLoading(false)
    if (result.error) { setError(result.error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{service ? 'Editar serviço' : 'Novo serviço'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Banho completo" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço base (R$) *" type="number" step="0.01" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            <Input label="Duração (minutos) *" type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="svc-active" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-gray-300" />
            <label htmlFor="svc-active" className="text-sm text-gray-700">Serviço ativo</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>{service ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
