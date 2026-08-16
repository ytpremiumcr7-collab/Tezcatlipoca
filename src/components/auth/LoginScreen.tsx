import { useState } from 'react'
import { api } from '@/services/apiClient'

interface Props {
  onLogin: (token: string, tenant: string | null) => void
}

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const resp = await api.login({ username, password })
      onLogin(resp.token, resp.tenant)
    } catch (err: any) {
      setError(err.message || 'Error de autenticacion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div className="panel scale-in" style={{ width: 380, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #38bdf8, #22d3ee, #34d399, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 22, fontWeight: 'bold', color: '#000',
          }}>T</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>TEZCATLIPOCA</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Spatial Workstation v2.0</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario@empresa.com"
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 6,
              background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-danger)',
              color: 'var(--text-danger)', fontSize: 12,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', marginTop: 4 }}
          >
            {loading ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : 'Iniciar Sesion'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
          Backend v38 • Conexion segura
        </div>
      </div>
    </div>
  )
}
