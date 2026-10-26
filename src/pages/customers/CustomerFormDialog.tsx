import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types'

interface Props {
  customer: Customer | null
  onClose: () => void
  onSaved: () => void
}

export function CustomerFormDialog({ customer, onClose, onSaved }: Props) {
  const { currentEstablishment } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [document, setDocument] = useState(customer?.document ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Informe o nome do tutor.')
      return
    }
    if (!currentEstablishment) return

    setLoading(true)

    const data = {
      establishment_id: currentEstablishment.id,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      document: document.trim() || null,
      notes: notes.trim() || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('customers') as any
    const result = customer
      ? await table.update(data).eq('id', customer.id)
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
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? 'Editar tutor' : 'Novo tutor'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Input label="CPF/CNPJ" value={document} onChange={(e) => setDocument(e.target.value)} helpText="Opcional" />
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>
              {customer ? 'Salvar alterações' : 'Cadastrar tutor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
