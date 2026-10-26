import { CheckCircle, Key, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface License {
  id: string
  plan: string
  status: string
  starts_at: string
  expires_at: string | null
  max_users: number
  features: Record<string, boolean>
}

export function LicensePage() {
  const { currentEstablishment } = useAuth()
  const [license, setLicense] = useState<License | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentEstablishment) { setLoading(false); return }
    supabase.from('licenses').select('*')
      .eq('establishment_id', currentEstablishment.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { setLicense(data as License | null); setLoading(false) })
  }, [currentEstablishment])

  function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—' }

  const planLabel: Record<string, string> = {
    free: 'Gratuito', basic: 'Básico', professional: 'Profissional', enterprise: 'Empresarial',
  }

  const statusLabel: Record<string, { text: string; cls: string }> = {
    active: { text: 'Ativa', cls: 'bg-success-50 text-success-700' },
    trial: { text: 'Período de teste', cls: 'bg-primary-50 text-primary-700' },
    expired: { text: 'Expirada', cls: 'bg-danger-50 text-danger-700' },
    suspended: { text: 'Suspensa', cls: 'bg-warning-50 text-warning-700' },
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Licença" description="Informações da licença do software" />
        <div className="flex flex-col items-center justify-center py-12 gap-3"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Carregando…</p></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Licença" description="Informações da licença do software" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Key className="w-5 h-5" /> Licença atual</h3>
          </CardHeader>
          <CardContent>
            {license ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Plano</span>
                  <span className="text-lg font-bold text-primary-600">{planLabel[license.plan] ?? license.plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(statusLabel[license.status] ?? statusLabel.active).cls}`}>
                    {(statusLabel[license.status] ?? { text: license.status }).text}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Início</span>
                  <span className="text-sm font-medium text-gray-900">{fmtDate(license.starts_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Validade</span>
                  <span className="text-sm font-medium text-gray-900">{fmtDate(license.expires_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Máx. usuários</span>
                  <span className="text-sm font-medium text-gray-900">{license.max_users}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhuma licença ativa encontrada.</p>
                <p className="text-gray-400 text-xs mt-1">O sistema está funcionando em modo gratuito com todas as funcionalidades.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Funcionalidades</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                'Dashboard com indicadores em tempo real',
                'Cadastro de clientes e pets',
                'Catálogo de produtos e serviços',
                'Gestão de estoque com alertas',
                'PDV completo com múltiplos pagamentos',
                'Controle de caixa (abertura/fechamento)',
                'Agendamento de banho e tosa',
                'Ordens de serviço',
                'Financeiro (contas a pagar/receber)',
                'Compras e fornecedores',
                'Relatórios gerenciais',
                'Multi-estabelecimento',
                'Controle de permissões por cargo',
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-success-500 shrink-0" />
                  <span className="text-gray-700">{feat}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500">PetGestão v{import.meta.env.VITE_APP_VERSION ?? '0.1.0'}</p>
          <p className="text-xs text-gray-400 mt-1">Sistema de gestão para pet shops e clínicas veterinárias</p>
        </CardContent>
      </Card>
    </div>
  )
}
