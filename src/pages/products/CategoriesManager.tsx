import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

interface Props {
  onClose: () => void
}

export function CategoriesManager({ onClose }: Props) {
  const { currentEstablishment } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!currentEstablishment) return
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('establishment_id', currentEstablishment.id)
      .order('name')
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!name.trim() || !currentEstablishment) return
    setError('')
    setSaving(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = supabase.from('categories') as any
    const payload = {
      establishment_id: currentEstablishment.id,
      name: name.trim(),
      description: description.trim() || null,
    }

    const result = editingId
      ? await table.update(payload).eq('id', editingId)
      : await table.insert(payload)

    setSaving(false)
    if (result.error) {
      setError(result.error.message.includes('unique') ? 'Já existe uma categoria com este nome.' : result.error.message)
      return
    }

    setName('')
    setDescription('')
    setEditingId(null)
    load()
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setName(cat.name)
    setDescription(cat.description ?? '')
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setName('')
    setDescription('')
    setError('')
  }

  async function toggleActive(cat: Category) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('categories') as any).update({ active: !cat.active }).eq('id', cat.id)
    load()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Fechar</button>
        </div>

        <div className="p-4 border-b border-gray-100">
          {error && <div className="mb-3 p-2 rounded bg-danger-50 text-danger-700 text-sm">{error}</div>}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Nome da categoria"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" onClick={handleSave} loading={saving} disabled={!name.trim()}>
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </Button>
              {editingId && (
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Nenhuma categoria cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                    cat.active ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    {cat.description && (
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => toggleActive(cat)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title={cat.active ? 'Desativar' : 'Ativar'}
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${cat.active ? 'text-danger-500' : 'text-success-500'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
