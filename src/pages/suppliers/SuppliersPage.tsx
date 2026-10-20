import { FileText, Plus, Search } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/types'
import { SupplierFormDialog } from './SupplierFormDialog'

export function SuppliersPage() {
  const { currentEstablishment } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  const load = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('establishment_id', currentEstablishment.id)
      .order('name')
    setSuppliers((data as Supplier[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.contact_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Fornecedores" description="Gerencie seus fornecedores"
        actions={<Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Novo fornecedor</Button>} />
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={FileText} title={search ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
              description="Cadastre fornecedores para registrar compras."
              actionLabel={!search ? 'Cadastrar fornecedor' : undefined} onAction={!search ? () => setShowForm(true) : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Nome</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Contato</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Telefone</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">E-mail</th>
                    <th className="px-3 sm:px-6 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditing(s); setShowForm(true) }}>
                      <td className="px-3 sm:px-6 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-600 hidden md:table-cell">{s.contact_name ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-600">{s.phone ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3 text-gray-600 hidden sm:table-cell">{s.email ?? '—'}</td>
                      <td className="px-3 sm:px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.active ? 'Ativo' : 'Inativo'}
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
      {showForm && <SupplierFormDialog supplier={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
  )
}
