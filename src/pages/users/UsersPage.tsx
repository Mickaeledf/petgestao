import { Plus, Search, Shield, UserCog, Eye, PenLine, Trash2, FilePlus } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, MODULE_LABELS } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import type { AppModule, RolePermission } from '@/types'

interface Member {
  id: string
  user_id: string
  role_id: string | null
  is_active: boolean
  created_at: string
  user_email?: string
  role?: { name: string; is_owner?: boolean } | null
}

interface RoleRow {
  id: string
  name: string
  description: string | null
  is_system: boolean
  is_owner: boolean
}

const ALL_MODULES: AppModule[] = [
  'dashboard', 'sales', 'pdv', 'cash_register',
  'customers', 'pets', 'products', 'services', 'professionals', 'suppliers',
  'schedule', 'service_orders', 'stock', 'purchases',
  'financial', 'reports', 'users', 'settings', 'license',
]

const ROLE_LABELS: Record<string, string> = {
  proprietario: 'Proprietário',
  gerente: 'Gerente',
  atendente: 'Atendente',
  banhista: 'Banhista',
  estoquista: 'Estoquista',
  financeiro: 'Financeiro',
  owner: 'Proprietário',
  admin: 'Administrador',
  manager: 'Gerente',
  attendant: 'Atendente',
  groomer: 'Tosador',
  viewer: 'Visualizador',
}

export function UsersPage() {
  const { currentEstablishment, user } = useAuth()
  const { isOwner } = usePermissions()
  const [members, setMembers] = useState<Member[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [savingPerm, setSavingPerm] = useState(false)

  const load = useCallback(async () => {
    if (!currentEstablishment) { setLoading(false); return }
    setLoading(true)
    const [membersRes, rolesRes] = await Promise.all([
      supabase.from('memberships').select('*, role:roles(name, is_owner)')
        .eq('establishment_id', currentEstablishment.id).order('created_at'),
      supabase.from('roles').select('*')
        .eq('establishment_id', currentEstablishment.id).order('name'),
    ])
    const rolesData = (rolesRes.data as RoleRow[]) ?? []
    setMembers((membersRes.data as unknown as Member[]) ?? [])
    setRoles(rolesData)

    if (rolesData.length > 0) {
      const roleIds = rolesData.map(r => r.id)
      const { data: permsData } = await supabase
        .from('role_permissions')
        .select('*')
        .in('role_id', roleIds)
      setRolePerms((permsData as RolePermission[]) ?? [])
    }
    setLoading(false)
  }, [currentEstablishment])

  useEffect(() => { load() }, [load])

  const filtered = members.filter((m) =>
    (m.user_email ?? m.user_id).toLowerCase().includes(search.toLowerCase()) ||
    m.role?.name?.toLowerCase().includes(search.toLowerCase())
  )

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
      status: 'active',
    })
    setInviteLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Membro adicionado com sucesso!')
    setInviteEmail(''); setInviteRole(''); setShowInvite(false); load()
  }

  async function togglePermission(roleId: string, module: AppModule, field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') {
    const role = roles.find(r => r.id === roleId)
    if (role?.is_owner) return

    setSavingPerm(true)
    const existing = rolePerms.find(p => p.role_id === roleId && p.module === module)
    const current = existing ? existing[field] : false

    if (existing) {
      const table = supabase.from('role_permissions') as any
      await table.update({ [field]: !current }).eq('id', existing.id)
    } else {
      const table = supabase.from('role_permissions') as any
      await table.insert({
        role_id: roleId,
        module,
        can_view: field === 'can_view' ? true : false,
        can_create: field === 'can_create' ? true : false,
        can_edit: field === 'can_edit' ? true : false,
        can_delete: field === 'can_delete' ? true : false,
      })
    }

    const roleIds = roles.map(r => r.id)
    const { data: permsData } = await supabase
      .from('role_permissions')
      .select('*')
      .in('role_id', roleIds)
    setRolePerms((permsData as RolePermission[]) ?? [])
    setSavingPerm(false)
  }

  function getPermValue(roleId: string, module: string, field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete'): boolean {
    const role = roles.find(r => r.id === roleId)
    if (role?.is_owner) return true
    const perm = rolePerms.find(p => p.role_id === roleId && p.module === module)
    return perm ? perm[field] : false
  }

  const selectedRoleData = roles.find(r => r.id === selectedRole)

  return (
    <div>
      <PageHeader title="Usuários e Permissões" description="Gerencie os acessos e permissões dos funcionários"
        actions={<Button onClick={() => setShowInvite(true)}><Plus className="w-4 h-4" /> Adicionar membro</Button>} />

      {error && <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg bg-success-50 text-success-700 text-sm">{success}</div>}

      {showInvite && (
        <Card className="mb-6">
          <CardHeader><h3 className="font-semibold text-gray-900">Adicionar membro</h3></CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input label="E-mail do usuário" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="usuario@email.com" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Cargo</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-3 border border-gray-300 rounded-lg text-sm min-h-[46px]">
                  <option value="">Selecione...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] ?? r.name}</option>)}
                </select>
              </div>
              <Button type="submit" loading={inviteLoading}>Adicionar</Button>
              <Button variant="secondary" type="button" onClick={() => setShowInvite(false)}>Cancelar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* MEMBROS */}
      <Card>
        <div className="px-6 py-7 sm:px-8 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar membro..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Carregando…</p></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={UserCog} title="Nenhum membro" description="Adicione membros ao seu estabelecimento."
              actionLabel="Adicionar" onAction={() => setShowInvite(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b border-gray-100 text-left">
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Usuário</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Cargo</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Status</th>
                <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Ações</th>
              </tr></thead><tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary-700">{(m.user_email ?? m.user_id).charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{m.user_email ?? m.user_id}</span>
                          {m.role?.is_owner && <span className="ml-2 text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full font-medium">OWNER</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {isOwner && !m.role?.is_owner ? (
                        <select value={m.role_id ?? ''} onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded text-sm">
                          {roles.filter(r => !r.is_owner).map((r) => <option key={r.id} value={r.id}>{ROLE_LABELS[r.name] ?? r.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700">{ROLE_LABELS[m.role?.name ?? ''] ?? m.role?.name ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${m.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                        {m.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      {isOwner && m.user_id !== user?.id && !m.role?.is_owner && (
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

      {/* CARGOS E PERMISSÕES */}
      <Card className="mt-6">
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Cargos e Permissões
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(selectedRole === r.id ? null : r.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedRole === r.id
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ROLE_LABELS[r.name] ?? r.name}
                {r.is_owner && <span className="ml-1 text-[10px]">(admin)</span>}
              </button>
            ))}
          </div>

          {selectedRole && selectedRoleData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap">Módulo</th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</div>
                    </th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1"><FilePlus className="w-3.5 h-3.5" /> Criar</div>
                    </th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1"><PenLine className="w-3.5 h-3.5" /> Editar</div>
                    </th>
                    <th className="px-4 sm:px-6 py-4 font-medium text-gray-500 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Excluir</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map((mod) => (
                    <tr key={mod} className="border-b border-gray-50">
                      <td className="px-4 sm:px-6 py-5 font-medium text-gray-900">{MODULE_LABELS[mod]}</td>
                      {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((field) => {
                        const checked = getPermValue(selectedRole, mod, field)
                        const disabled = selectedRoleData.is_owner || !isOwner || savingPerm
                        return (
                          <td key={field} className="px-4 sm:px-6 py-5 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => togglePermission(selectedRole, mod, field)}
                              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedRoleData.is_owner && (
                <p className="px-4 py-3 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                  O cargo Proprietário tem acesso total e irrestrito. Suas permissões não podem ser alteradas.
                </p>
              )}
              {!isOwner && !selectedRoleData.is_owner && (
                <p className="px-4 py-3 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                  Apenas o proprietário pode alterar as permissões dos cargos.
                </p>
              )}
            </div>
          )}

          {!selectedRole && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              Selecione um cargo acima para visualizar e editar suas permissões.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
