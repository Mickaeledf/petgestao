import { Dog, Plus, Search } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Pet } from '@/types'
import { PetFormDialog } from './PetFormDialog'

const sizeLabels: Record<string, string> = {
  mini: 'Mini',
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
  gigante: 'Gigante',
}

export function PetsPage() {
  const { currentEstablishment } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)

  const loadPets = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const { data } = await supabase
      .from('pets')
      .select('*, customer:customers(id, name)')
      .eq('establishment_id', currentEstablishment.id)
      .order('name')
    setPets((data as unknown as Pet[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { loadPets() }, [loadPets])

  const filtered = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.breed?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Animais"
        description="Gerencie os animais cadastrados"
        actions={
          <Button onClick={() => { setEditingPet(null); setShowForm(true) }}>
            <Plus className="w-4 h-4" /> Novo animal
          </Button>
        }
      />
      <Card>
        <div className="px-6 py-7 sm:px-8 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, tutor ou raça..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Carregando…</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Dog}
              title={search ? 'Nenhum animal encontrado' : 'Nenhum animal cadastrado'}
              description={search ? 'Tente buscar com outros termos.' : 'Cadastre tutores primeiro, depois adicione seus animais.'}
              actionLabel={!search ? 'Cadastrar animal' : undefined}
              onAction={!search ? () => { setEditingPet(null); setShowForm(true) } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Nome</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Tutor</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Espécie</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap hidden md:table-cell">Raça</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap hidden md:table-cell">Porte</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((pet) => (
                    <tr
                      key={pet.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setEditingPet(pet); setShowForm(true) }}
                    >
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{pet.name}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600">{pet.customer?.name ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 hidden sm:table-cell">{pet.species}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 hidden md:table-cell">{pet.breed ?? '—'}</td>
                      <td className="px-4 sm:px-6 py-5 text-gray-600 hidden md:table-cell">{pet.size ? sizeLabels[pet.size] ?? pet.size : '—'}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          pet.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {pet.status === 'active' ? 'Ativo' : 'Inativo'}
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
        <PetFormDialog
          pet={editingPet}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadPets() }}
        />
      )}
    </div>
  )
}
