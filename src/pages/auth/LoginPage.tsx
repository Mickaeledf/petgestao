import { PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Preencha todos os campos.')
      return
    }

    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)

    if (signInError) {
      setError('E-mail ou senha inválidos.')
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <PawPrint className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">PetGestão</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de gestão para pet shops</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Entrar</h2>

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
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Link to="/auth/forgot-password" className="text-sm text-primary-600 hover:underline block">
              Esqueci minha senha
            </Link>
            <p className="text-sm text-gray-500">
              Não tem conta?{' '}
              <Link to="/auth/register" className="text-primary-600 hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
