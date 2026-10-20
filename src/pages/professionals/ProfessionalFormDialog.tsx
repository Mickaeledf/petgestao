import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Professional } from '@/types'

interface Props {
  professional: Professional | null
  onClose: () => void
  onSaved: () => void
}

export function ProfessionalFormDialog({ professional, onClose, onSaved }: Props) {
  const { currentEstablishment } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(professional?.name ?? '')
  const [phone, setPhone] = useState(professional?.phone ?? '')
  const [active, setActive] = useState(professional?.active ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Informe o nome.'); return }
    if (!currentEstablishment) return

    setLoading(true)
    const data = {
      establishment_id: currentEstablishment.id,
      name: name.trim(),
      phone: phone.trim() || null,
      active,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('professionals') as any
    const result = professional ? await table.update(data).eq('id', professional.id) : await table.insert(data)
    setLoading(false)
    if (result.error) { setError(result.error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{professional ? 'Editar profissional' : 'Novo profissional'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="prof-active" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-gray-300" />
            <label htmlFor="prof-active" className="text-sm text-gray-700">Profissional ativo</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>{professional ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
