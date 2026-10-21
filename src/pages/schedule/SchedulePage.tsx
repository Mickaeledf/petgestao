import { Calendar, Plus } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AppointmentFormDialog } from './AppointmentFormDialog'

interface Appointment {
  id: string
  date: string
  start_time: string
  end_time: string | null
  status: string
  price: number | null
  notes: string | null
  customer?: { name: string } | null
  pet?: { name: string } | null
  professional?: { name: string } | null
  service?: { name: string } | null
}

export function SchedulePage() {
  const { currentEstablishment } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('*, customer:customers(name), pet:pets(name), professional:professionals(name), service:services(name)')
      .eq('establishment_id', currentEstablishment.id)
      .eq('date', selectedDate)
      .order('start_time')
    setAppointments((data as unknown as Appointment[]) ?? [])
    setLoading(false)
  }, [currentEstablishment, selectedDate])

  useEffect(() => { load() }, [load])

  function fmt(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    scheduled: { text: 'Agendado', cls: 'bg-primary-50 text-primary-700' },
    confirmed: { text: 'Confirmado', cls: 'bg-primary-50 text-primary-700' },
    in_progress: { text: 'Em andamento', cls: 'bg-warning-50 text-warning-700' },
    completed: { text: 'Concluído', cls: 'bg-success-50 text-success-700' },
    cancelled: { text: 'Cancelado', cls: 'bg-gray-100 text-gray-600' },
    no_show: { text: 'Não compareceu', cls: 'bg-danger-50 text-danger-700' },
  }

  return (
    <div>
      <PageHeader title="Agenda" description="Agendamento de banho e tosa"
        actions={<Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Novo agendamento</Button>} />

      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <span className="text-sm text-gray-600">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhum agendamento nesta data" description="Agende banho e tosa para seus clientes."
              actionLabel="Agendar" onAction={() => setShowForm(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Horário</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Cliente</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Pet</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Serviço</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Profissional</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-gray-500 text-right">Valor</th>
                <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Status</th>
              </tr></thead><tbody>
                {appointments.map((a) => {
                  const st = statusLabel[a.status] ?? { text: a.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => { setEditing(a); setShowForm(true) }}>
                      <td className="px-3 sm:px-6 py-3 font-mono text-gray-900">{a.start_time.slice(0, 5)}{a.end_time ? ` - ${a.end_time.slice(0, 5)}` : ''}</td>
                      <td className="px-3 sm:px-6 py-3 font-medium text-gray-900">{a.customer?.name ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-600">{a.pet?.name ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-600">{a.service?.name ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-600">{a.professional?.name ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-900 text-right">{a.price ? fmt(a.price) : '—'}</td>
                      <td className="px-3 sm:px-6 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.text}</span></td>
                    </tr>)
                })}
              </tbody></table>
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && <AppointmentFormDialog appointment={editing} defaultDate={selectedDate} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
