import { X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Props {
  appointment: any | null
  defaultDate: string
  onClose: () => void
  onSaved: () => void
}

export function AppointmentFormDialog({ appointment, defaultDate, onClose, onSaved }: Props) {
  const { currentEstablishment, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [pets, setPets] = useState<any[]>([])
  const [professionals, setProfessionals] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  const [customerId, setCustomerId] = useState(appointment?.customer_id ?? '')
  const [petId, setPetId] = useState(appointment?.pet_id ?? '')
  const [professionalId, setProfessionalId] = useState(appointment?.professional_id ?? '')
  const [serviceId, setServiceId] = useState(appointment?.service_id ?? '')
  const [date, setDate] = useState(appointment?.date ?? defaultDate)
  const [startTime, setStartTime] = useState(appointment?.start_time?.slice(0, 5) ?? '09:00')
  const [endTime, setEndTime] = useState(appointment?.end_time?.slice(0, 5) ?? '')
  const [price, setPrice] = useState(appointment?.price?.toString() ?? '')
  const [status, setStatus] = useState(appointment?.status ?? 'scheduled')
  const [notes, setNotes] = useState(appointment?.notes ?? '')

  useEffect(() => {
    if (!currentEstablishment) return
    supabase.from('customers').select('id, name').eq('establishment_id', currentEstablishment.id).eq('status', 'active').order('name').then(({ data }) => setCustomers(data ?? []))
    supabase.from('professionals').select('id, name').eq('establishment_id', currentEstablishment.id).eq('active', true).order('name').then(({ data }) => setProfessionals(data ?? []))
    supabase.from('services').select('id, name, base_price, duration_minutes').eq('establishment_id', currentEstablishment.id).eq('active', true).order('name').then(({ data }) => setServices(data ?? []))
  }, [currentEstablishment])

  useEffect(() => {
    if (!customerId || !currentEstablishment) { setPets([]); return }
    supabase.from('pets').select('id, name').eq('establishment_id', currentEstablishment.id).eq('customer_id', customerId).eq('status', 'active').order('name').then(({ data }) => setPets(data ?? []))
  }, [customerId, currentEstablishment])

  function onServiceChange(sId: string) {
    setServiceId(sId)
    const svc = services.find((s) => s.id === sId)
    if (svc) {
      if (!price) setPrice(svc.base_price.toString())
      if (!endTime && startTime) {
        const [h, m] = startTime.split(':').map(Number)
        const total = h * 60 + m + svc.duration_minutes
        setEndTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!customerId) { setError('Selecione o cliente.'); return }
    if (!petId) { setError('Selecione o pet.'); return }
    if (!date || !startTime) { setError('Informe data e horário.'); return }
    if (!currentEstablishment) return

    setLoading(true)
    const data = {
      establishment_id: currentEstablishment.id,
      customer_id: customerId, pet_id: petId,
      professional_id: professionalId || null, service_id: serviceId || null,
      date, start_time: startTime, end_time: endTime || null,
      price: price ? Number(price) : null, status, notes: notes.trim() || null,
      created_by: user?.id,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('appointments') as any
    const result = appointment ? await table.update(data).eq('id', appointment.id) : await table.insert(data)
    setLoading(false)
    if (result.error) { setError(result.error.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-0 sm:mx-4">
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{appointment ? 'Editar agendamento' : 'Novo agendamento'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 overflow-y-auto">
          {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Cliente *</label>
              <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPetId('') }}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm min-h-[46px]">
                <option value="">Selecione...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Pet *</label>
              <select value={petId} onChange={(e) => setPetId(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm min-h-[46px]" disabled={!customerId}>
                <option value="">Selecione...</option>
                {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Serviço</label>
              <select value={serviceId} onChange={(e) => onServiceChange(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm min-h-[46px]">
                <option value="">Selecione...</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Profissional</label>
              <select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm min-h-[46px]">
                <option value="">Qualquer</option>
                {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Input label="Data *" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Início *" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input label="Fim" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            <Input label="Valor (R$)" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          {appointment && (
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm min-h-[46px]">
                <option value="scheduled">Agendado</option><option value="confirmed">Confirmado</option><option value="in_progress">Em andamento</option>
                <option value="completed">Concluído</option><option value="cancelled">Cancelado</option><option value="no_show">Não compareceu</option>
              </select>
            </div>
          )}
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[46px]" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading}>{appointment ? 'Salvar' : 'Agendar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
