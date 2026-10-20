import { Building2, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const { currentEstablishment, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')

  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [savingUser, setSavingUser] = useState(false)

  useEffect(() => {
    if (!currentEstablishment) { setLoading(false); return }
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('establishments').select('*').eq('id', currentEstablishment!.id).single()
      if (data) {
        setName(data.name ?? '')
        setDocument((data as any).document ?? '')
        setPhone((data as any).phone ?? '')
        setEmail((data as any).email ?? '')
        setAddress((data as any).address ?? '')
        setCity((data as any).city ?? '')
        setState((data as any).state ?? '')
        setZip((data as any).zip ?? '')
      }
      setLoading(false)
    }
    load()
  }, [currentEstablishment])

  useEffect(() => {
    if (!user) return
    setUserName(user.user_metadata?.name ?? user.user_metadata?.full_name ?? '')
    setUserPhone(user.user_metadata?.phone ?? '')
  }, [user])

  async function handleSaveEstablishment(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('')
    if (!name.trim()) { setError('Informe o nome do estabelecimento.'); return }
    if (!currentEstablishment) return

    setSaving(true)
    const table = supabase.from('establishments') as any
    const { error: err } = await table.update({
      name: name.trim(), document: document.trim() || null,
      phone: phone.trim() || null, email: email.trim() || null,
      address: address.trim() || null, city: city.trim() || null,
      state: state.trim() || null, zip: zip.trim() || null,
    }).eq('id', currentEstablishment.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess('Configurações salvas com sucesso!')
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('')
    setSavingUser(true)
    const { error: err } = await supabase.auth.updateUser({
      data: { name: userName.trim(), phone: userPhone.trim() || null },
    })
    setSavingUser(false)
    if (err) { setError(err.message); return }
    setSuccess('Perfil atualizado com sucesso!')
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Configurações" description="Configurações do estabelecimento e perfil" />
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Configurações do estabelecimento e perfil" />

      {error && <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-lg bg-success-50 text-success-700 text-sm">{success}</div>}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5" /> Dados do estabelecimento</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveEstablishment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nome do estabelecimento *" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="CNPJ / CPF" value={document} onChange={(e) => setDocument(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Input label="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" />
                <Input label="CEP" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="00000-000" />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Salvar</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Meu perfil</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nome" value={userName} onChange={(e) => setUserName(e.target.value)} />
                <Input label="Telefone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">{user?.email ?? '—'}</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={savingUser}><Save className="w-4 h-4" /> Atualizar perfil</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
