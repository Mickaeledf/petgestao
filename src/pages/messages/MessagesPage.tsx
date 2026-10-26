import { MessageSquare } from 'lucide-react'

export function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mb-4 border border-primary-100">
        <MessageSquare className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">Mensagens</h2>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">
        A caixa de mensagens estará disponível em breve. Aqui você poderá enviar avisos para seus clientes.
      </p>
    </div>
  )
}
