import { Plus, Search, Shield, UserCog } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Member {
  id: string
  user_id: string
  role_id: string | null
  is_active: boolean
  created_at: string
  user_email?: string
  role?: { name: string } | null
}

interface Role {
  id: string
  name: string
  description: string | null
  is_system: boolean
}

export function UsersPage() {
  const { currentEstablishment, user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    const [membersRes, rolesRes] = await Promise.all([
      supabase.from('memberships').select('*, role:roles(name)')
        .eq('establishment_id', currentEstablishment.id).order('created_at'),
      supabase.from('roles').select('*').order('name'),
    ])
    setMembers((membersRes.data as unknown as Member[]) ?? [])
    setRoles((rolesRes.data as Role[]) ?? [])
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = members.filter((m) =>
    (m.user_email ?? m.user_id).toLowerCase().includes(search.toLowerCase()) ||
    m.role?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const roleLabel: Record<string, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    manager: 'Gerente',
    attendant: 'Atendente',
    groomer: 'Tosador',
    viewer: 'Visualizador',
  }

  async function handleUpdateRole(memberId: string, roleId: string) {
    setError('')
    const table = supabase.from('memberships') as any
    const { error: err } = await table.update({ role_id: roleId }).eq('id', memberId)
    if (err) { setError(err.message); return }
    load()
  }

  async function handleToggleActive(memberId: string, currentActive: boolean) {
    setError('')
    const table = supabase.from('memberships') as any
    const { error: err } = await table.update({ is_active: !currentActive }).eq('id', memberId)
    if (err) { setError(err.message); return }
    load()
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) { setError('Informe o e-mail.'); return }
    if (!inviteRole) { setError('Selecione o cargo.'); return }
    if (!currentEstablishment) return
    setInviteLoading(true); setError(''); setSuccess('')

    const { data: existingUser } = await supabase.from('memberships').select('id')
      .eq('establishment_id', currentEstablishment.id)
      .eq('user_id', inviteEmail.trim()).maybeSingle()

    if (existingUser) {
      setError('Este usuário já é membro do estabelecimento.')
      setInviteLoading(false); return
    }

    const table = supabase.from('memberships') as any
    const { error: err } = await table.insert({
      establishment_id: currentEstablishment.id,
      user_id: inviteEmail.trim(),
      role_id: inviteRole,
      is_active: true,
    })
    setInviteLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Membro adicionado com sucesso!')
    setInviteEmail(''); setInviteRole(''); setShowInvite(false); load()
  }

  return (
    <div>
      <PageHeader title="Usuários e Permissões" description="Gerencie os acessos e permissões dos funcionários"
        actions={<Button onClick={() => setShowInvite(true)}><Plus className="w-4 h-4" /> Adicionar membro</Button>} />

      {error && <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg bg-success-50 text-success-700 text-sm">{success}</div>}

      {showInvite && (
        <Card className="mb-4">
          <CardHeader><h3 className="font-semibold text-gray-900">Adicionar membro</h3></CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input label="E-mail do usuário" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="usuario@email.com" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Cargo</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Selecione...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{roleLabel[r.name] ?? r.name}</option>)}
                </select>
              </div>
              <Button type="submit" loading={inviteLoading}>Adicionar</Button>
              <Button variant="secondary" type="button" onClick={() => setShowInvite(false)}>Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar membro..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={UserCog} title="Nenhum membro" description="Adicione membros ao seu estabelecimento."
              actionLabel="Adicionar" onAction={() => setShowInvite(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Usuário</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Cargo</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Status</th>
                <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Ações</th>
              </tr></thead><tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">{(m.user_email ?? m.user_id).charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-gray-900">{m.user_email ?? m.user_id}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <select value={m.role_id ?? ''} onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded text-sm">
                        {roles.map((r) => <option key={r.id} value={r.id}>{roleLabel[r.name] ?? r.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                        {m.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {m.user_id !== user?.id && (
                        <button onClick={() => handleToggleActive(m.id, m.is_active)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline">
                          {m.is_active ? 'Desativar' : 'Ativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><h3 className="font-semibold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5" /> Cargos do sistema</h3></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
            <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Cargo</th>
            <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Descrição</th>
            <th className="px-4 sm:px-6 py-3.5 font-medium text-gray-500 whitespace-nowrap">Tipo</th>
          </tr></thead><tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b border-gray-50">
                <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">{roleLabel[r.name] ?? r.name}</td>
                <td className="px-4 sm:px-6 py-4 text-gray-600">{r.description ?? '—'}</td>
                <td className="px-4 sm:px-6 py-4"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.is_system ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>{r.is_system ? 'Sistema' : 'Personalizado'}</span></td>
              </tr>
            ))}
          </tbody></table>
        </CardContent>
      </Card>
    </div>
  )
}
