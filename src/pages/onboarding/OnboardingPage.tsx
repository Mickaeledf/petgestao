import { Building2, PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function OnboardingPage() {
  const { user, reloadMemberships } = useAuth()
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!name.trim()) { setError('Informe o nome do seu pet shop.'); return }

    setLoading(true)
    const { data, error: err } = await supabase.rpc('create_establishment_with_owner', {
      p_name: name.trim(),
      p_document: document.trim() || null,
      p_phone: phone.trim() || null,
      p_email: email.trim() || null,
    })
    setLoading(false)

    if (err) { setError(err.message); return }
    await reloadMemberships()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 mb-4">
            <PawPrint className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao PetGestão!</h1>
          <p className="text-gray-600 mt-2">Configure seu pet shop para começar a usar o sistema.</p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">{error}</div>}

              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Dados do estabelecimento</h2>
              </div>

              <Input label="Nome do pet shop *" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex: PetShop Amigo Fiel" />
              <Input label="CNPJ / CPF" value={document} onChange={(e) => setDocument(e.target.value)}
                placeholder="00.000.000/0000-00" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000" />
                <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="pt-4">
                <Button type="submit" loading={loading} className="w-full">
                  Criar meu pet shop
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
