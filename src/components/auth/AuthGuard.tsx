import { useEffect, useState } from 'react'
import { useTezcatlipoca } from '@/stores/tezcatlipocaStore'
import { api } from '@/services/apiClient'
import LoginScreen from './LoginScreen'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authToken, setAuth } = useTezcatlipoca()
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('tz_token')
    const tenant = localStorage.getItem('tz_tenant')

    if (token) {
      api.setToken(token)
      // Verify token validity
      api.me()
        .then(() => {
          setAuth(token, tenant)
          setValid(true)
        })
        .catch(() => {
          localStorage.removeItem('tz_token')
          localStorage.removeItem('tz_tenant')
          setAuth(null, null)
          setValid(false)
        })
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
      setValid(false)
    }
  }, [setAuth])

  if (checking) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 20,
        background: 'var(--bg-primary)',
      }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Verificando sesión...
        </span>
      </div>
    )
  }

  if (!valid || !authToken) {
    return <LoginScreen onLogin={(token: string, tenant: string | null) => {
      localStorage.setItem('tz_token', token)
      localStorage.setItem('tz_tenant', tenant || '')
      api.setToken(token)
      setAuth(token, tenant)
      setValid(true)
    }} />
  }

  return <>{children}</>
}
