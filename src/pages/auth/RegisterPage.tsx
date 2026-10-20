import { PawPrint } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

export function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Preencha todos os campos.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await signUp(email, password, fullName)
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-50 mb-4">
              <PawPrint className="w-8 h-8 text-success-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Cadastro realizado!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Verifique seu e-mail para confirmar a conta.
            </p>
            <Button onClick={() => navigate('/auth/login')} className="w-full">
              Ir para o login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <PawPrint className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre-se para usar o PetGestão</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-50 text-danger-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
            />
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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />
            <Input
              label="Confirmar senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} className="w-full">
              Criar conta
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <Link to="/auth/login" className="text-primary-600 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
