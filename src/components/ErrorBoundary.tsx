import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 16,
          padding: 24,
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
        }}>
          <div style={{ fontSize: 48 }}>💥</div>
          <h2 style={{ color: 'var(--text-danger)' }}>Error en Tezcatlipoca</h2>
          <pre style={{
            background: 'var(--bg-secondary)',
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            maxWidth: 600,
            overflow: 'auto',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          }}>
            {this.state.error?.message}
            {'\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="tool-btn"
          >
            🔄 Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
