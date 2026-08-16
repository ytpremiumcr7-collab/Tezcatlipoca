interface Props {
  message?: string
}

export default function LoadingScreen({ message }: Props) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      zIndex: 9999,
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '3px solid rgba(255,165,0,0.2)',
        borderTop: '3px solid #ffa500',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#ffa500', marginTop: '1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: '0.2em' }}>
        {message || 'TEZCATLIPOCA INITIALIZING...'}
      </p>
    </div>
  )
}
