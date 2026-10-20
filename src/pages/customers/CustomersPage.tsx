import { Plus, Search, Users } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types'
import { CustomerFormDialog } from './CustomerFormDialog'

export function CustomersPage() {
  const { currentEstablishment } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const loadCustomers = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('establishment_id', currentEstablishment.id)
      .order('name')
    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { loadCustomers() }, [loadCustomers])

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Tutores"
        description="Gerencie os tutores e clientes do estabelecimento"
        actions={
          <Button onClick={() => { setEditingCustomer(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> Novo tutor
          </Button>
        }
      />
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search ? 'Nenhum tutor encontrado' : 'Nenhum tutor cadastrado'}
              description={search ? 'Tente buscar com outros termos.' : 'Cadastre o primeiro tutor.'}
              actionLabel={!search ? 'Cadastrar tutor' : undefined}
              onAction={!search ? () => { setEditingCustomer(null); setShowForm(true) } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">Nome</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Telefone</th>
                    <th className="px-6 py-3 font-medium text-gray-500">E-mail</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditingCustomer(customer); setShowForm(true) }}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{customer.name}</td>
                      <td className="px-6 py-3 text-gray-600">{customer.phone ?? '—'}</td>
                      <td className="px-6 py-3 text-gray-600">{customer.email ?? '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          customer.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {showForm && (
        <CustomerFormDialog
          customer={editingCustomer}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadCustomers() }}
        />
      )}
    </div>
  )
}
