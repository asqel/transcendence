// src/pages/Login.tsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  // État pour basculer entre les deux modes
  const [mode, setMode] = useState<'signin' | 'register'>('signin')

  // Champs partagés / spécifiques
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signin, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        await signin(username, password)
        navigate('/')
      }
      else {
        // Inscription
        if (password !== confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas')
        }
        await signup(username, password, email)
        await signin(username, password)
        navigate('/')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>{mode === 'signin' ? 'Connexion' : 'Inscription'}</h1>

      {/* Boutons pour basculer entre les modes */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setMode('signin')}
          style={{
            marginRight: '8px',
            fontWeight: mode === 'signin' ? 'bold' : 'normal',
            background: mode === 'signin' ? '#007bff' : '#ccc',
            color: mode === 'signin' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Se connecter
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          style={{
            fontWeight: mode === 'register' ? 'bold' : 'normal',
            background: mode === 'register' ? '#007bff' : '#ccc',
            color: mode === 'register' ? 'white' : 'black',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          S'inscrire
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur"
          style={{ display: 'block', marginBottom: '8px' }}
        />
        {mode === 'register' && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ display: 'block', marginBottom: '8px' }}
          />
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
          style={{ display: 'block', marginBottom: '8px' }}
        />

        {mode === 'register' && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe"
            required
            style={{ display: 'block', marginBottom: '8px' }}
          />
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? '...'
            : mode === 'signin'
            ? 'Se connecter'
            : "S'inscrire"}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  )
}