'use client'

import {useState} from 'react'
import {LockKeyhole} from 'lucide-react'
import {AdminButton, AdminCard} from './AdminShell'

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
    <main className="min-h-screen bg-[#f1f2f4] px-4 py-10 text-[#202223] [font-family:var(--font-geist),sans-serif]">
      <AdminCard className="mx-auto max-w-md overflow-hidden">
        <div className="border-b border-[#f1f2f3] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#d2d5d8] bg-[#f6f6f7]">
              <LockKeyhole className="h-4 w-4 text-[#5c5f62]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
                Backoffice
              </p>
              <h1 className="text-lg font-semibold text-[#202223]">
                Autentificare admin
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#6d7175]">
              Parolă admin
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full rounded-md border border-[#aeb4b9] bg-white px-3 text-sm text-[#202223] outline-none transition focus:border-[#008060] focus:ring-2 focus:ring-[#008060]/20"
              autoComplete="current-password"
              required
            />
          </div>
          <AdminButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se verifică...' : 'Autentificare'}
          </AdminButton>
        </form>
      </AdminCard>
    </main>
  )
}
