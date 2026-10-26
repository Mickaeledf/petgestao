import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Customer, Pet } from '@/types'

interface Props {
  pet: Pet | null
  onClose: () => void
  onSaved: () => void
}

export function PetFormDialog({ pet, onClose, onSaved }: Props) {
  const { currentEstablishment } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(pet?.name ?? '')
  const [customerId, setCustomerId] = useState(pet?.customer_id ?? '')
  const [species, setSpecies] = useState(pet?.species ?? 'Cão')
  const [breed, setBreed] = useState(pet?.breed ?? '')
  const [sex, setSex] = useState(pet?.sex ?? '')
  const [birthDate, setBirthDate] = useState(pet?.birth_date ?? '')
  const [size, setSize] = useState(pet?.size ?? '')
  const [color, setColor] = useState(pet?.color ?? '')
  const [weight, setWeight] = useState(pet?.weight?.toString() ?? '')
  const [behaviorNotes, setBehaviorNotes] = useState(pet?.behavior_notes ?? '')
  const [careNotes, setCareNotes] = useState(pet?.care_notes ?? '')

  useEffect(() => {
    if (!currentEstablishment) return
    supabase
      .from('customers')
      .select('id, name')
      .eq('establishment_id', currentEstablishment.id)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setCustomers((data as Customer[]) ?? []))
  }, [currentEstablishment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Informe o nome do animal.'); return }
    if (!customerId) { setError('Selecione o tutor.'); return }
    if (!currentEstablishment) return

    setLoading(true)

    const data = {
      establishment_id: currentEstablishment.id,
      customer_id: customerId,
      name: name.trim(),
      species,
      breed: breed.trim() || null,
      sex: sex || null,
      birth_date: birthDate || null,
      size: size || null,
      color: color.trim() || null,
      weight: weight ? Number(weight) : null,
      weight_date: weight ? new Date().toISOString().split('T')[0] : null,
      behavior_notes: behaviorNotes.trim() || null,
      care_notes: careNotes.trim() || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('pets') as any
    const result = pet
      ? await table.update(data).eq('id', pet.id)
      : await table.insert(data)

    setLoading(false)
    if (result.error) { setError(result.error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-0 sm:mx-4">
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {pet ? 'Editar animal' : 'Novo animal'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input label="Nome do animal *" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Tutor *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
              >
                <option value="">Selecione o tutor</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Espécie</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
              >
                <option value="Cão">Cão</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Roedor">Roedor</option>
                <option value="Réptil">Réptil</option>
                <option value="Peixe">Peixe</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <Input label="Raça" value={breed} onChange={(e) => setBreed(e.target.value)} />
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Sexo</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
              >
                <option value="">Não informado</option>
                <option value="macho">Macho</option>
                <option value="femea">Fêmea</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Porte</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
              >
                <option value="">Não informado</option>
                <option value="mini">Mini</option>
                <option value="pequeno">Pequeno</option>
                <option value="medio">Médio</option>
                <option value="grande">Grande</option>
                <option value="gigante">Gigante</option>
              </select>
            </div>
            <Input label="Cor" value={color} onChange={(e) => setColor(e.target.value)} />
            <Input label="Peso (kg)" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Input label="Data de nascimento" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>

          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-gray-700">Observações de comportamento</label>
            <textarea
              value={behaviorNotes}
              onChange={(e) => setBehaviorNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Agitado, morde, precisa de focinheira..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
            />
          </div>

          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-gray-700">Preferências de atendimento</label>
            <textarea
              value={careNotes}
              onChange={(e) => setCareNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Tosa na máquina 3, banho com shampoo neutro..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>
              {pet ? 'Salvar alterações' : 'Cadastrar animal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
