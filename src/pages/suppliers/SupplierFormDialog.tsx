import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/types'

interface Props {
  supplier: Supplier | null
  onClose: () => void
  onSaved: () => void
}

export function SupplierFormDialog({ supplier, onClose, onSaved }: Props) {
  const { currentEstablishment } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(supplier?.name ?? '')
  const [document, setDocument] = useState(supplier?.document ?? '')
  const [phone, setPhone] = useState(supplier?.phone ?? '')
  const [email, setEmail] = useState(supplier?.email ?? '')
  const [contactName, setContactName] = useState(supplier?.contact_name ?? '')
  const [address, setAddress] = useState(supplier?.address ?? '')
  const [notes, setNotes] = useState(supplier?.notes ?? '')
  const [active, setActive] = useState(supplier?.active ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Informe o nome do fornecedor.'); return }
    if (!currentEstablishment) return

    setLoading(true)
    const data = {
      establishment_id: currentEstablishment.id,
      name: name.trim(),
      document: document.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      contact_name: contactName.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      active,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('suppliers') as any
    const result = supplier ? await table.update(data).eq('id', supplier.id) : await table.insert(data)
    setLoading(false)
    if (result.error) { setError(result.error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{supplier ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nome / Razão social *" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="CNPJ / CPF" value={document} onChange={(e) => setDocument(e.target.value)} helpText="Opcional" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Contato comercial" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>
          <Input label="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sup-active" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-gray-300" />
            <label htmlFor="sup-active" className="text-sm text-gray-700">Fornecedor ativo</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>{supplier ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
