import { ShieldX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function AccessDeniedPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8 text-danger-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso negado</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        Você não tem permissão para acessar esta página. Entre em contato com o proprietário do estabelecimento para solicitar acesso.
      </p>
      <Button onClick={() => navigate('/')}>Voltar ao início</Button>
    </div>
  )
}
