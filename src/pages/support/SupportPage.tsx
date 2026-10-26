import { BookOpen, HelpCircle, MessageCircle } from 'lucide-react'

export function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
        <p className="text-sm text-gray-500 mt-1">Precisa de ajuda? Estamos aqui para você.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mx-auto mb-3 border border-primary-100">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Fale com a gente</h3>
          <p className="text-xs text-gray-500 mb-3">Tire suas dúvidas pelo WhatsApp</p>
          <span className="text-xs text-gray-400 italic">Número em breve</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Manual de uso</h3>
          <p className="text-xs text-gray-500 mb-3">Aprenda a usar o PetGestão</p>
          <span className="text-xs text-gray-400 italic">Em breve</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3 border border-amber-100">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Perguntas frequentes</h3>
          <p className="text-xs text-gray-500 mb-3">Respostas para dúvidas comuns</p>
          <span className="text-xs text-gray-400 italic">Em breve</span>
        </div>
      </div>
    </div>
  )
}
