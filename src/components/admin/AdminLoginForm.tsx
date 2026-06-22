'use client'

import {useState} from 'react'

type AdminLoginFormProps = {
  onSuccess: () => void
}

type LoginResponse = {
  success?: boolean
  error?: string
}

export function AdminLoginForm({onSuccess}: AdminLoginFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({password}),
      })
      const data = (await response.json()) as LoginResponse

      if (!response.ok || !data.success) {
        setError(data.error || 'Autentificarea a eșuat.')
        return
      }

      setPassword('')
      onSuccess()
    } catch {
      setError('A apărut o eroare de rețea.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground sm:py-16">
      <div className="w-full max-w-[420px] rounded-lg bg-background p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
          Autentificare admin
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="relative rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              Parolă
            </label>
            <input
              type="password"
              placeholder="Parola admin"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-none border-2 border-muted bg-background px-3 py-2 text-lg text-foreground outline-none placeholder:text-muted-foreground focus:border-black focus:ring-2 focus:ring-black/20 disabled:bg-secondary disabled:opacity-50"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full cursor-pointer rounded-none border border-black bg-black px-4 py-2 text-white transition-all hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Se verifică...' : 'Autentificare'}
          </button>
        </form>
      </div>
    </main>
  )
}
