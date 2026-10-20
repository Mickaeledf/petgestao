import { PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Informe seu e-mail.')
      return
    }

    setLoading(true)
    const { error: resetError } = await resetPassword(email)
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <PawPrint className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recuperar senha</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {sent ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
              </p>
              <Link to="/auth/login" className="text-sm text-primary-600 hover:underline">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
                <Button type="submit" loading={loading} className="w-full">
                  Enviar link
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-gray-500">
                <Link to="/auth/login" className="text-primary-600 hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
