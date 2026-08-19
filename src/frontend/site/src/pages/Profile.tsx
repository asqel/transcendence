import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


function Profile() {
  const { user, logout, delete_account } = useAuth()
  const navigate = useNavigate()

  //const [newPassword, setNewPassword] = useState('')
  //const [confirmPassword, setConfirmPassword] = useState('')
  //const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  //const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  if (!user) {
    return <div>Chargement du profil...</div>
  }

//  const handlePasswordChange = async (e: React.FormEvent) => {
//    e.preventDefault()
//    setMessage(null)
//    setError(null)
//
//    if (newPassword.length < 6) {
//      setError('Le mot de passe doit contenir au moins 6 caractères.')
//      return
//    }
//    if (newPassword !== confirmPassword) {
//      setError('Les mots de passe ne correspondent pas.')
//      return
//    }
//
//    try {
//      setLoadingPassword(true)
//      // 🔧 À adapter selon ton backend / AuthContext
//      await useAuthChangePassword(newPassword)
//      setMessage('Mot de passe mis à jour avec succès.')
//      setNewPassword('')
//      setConfirmPassword('')
//    } catch (err) {
//      setError("Impossible de changer le mot de passe. Réessaie plus tard.")
//    } finally {
//      setLoadingPassword(false)
//    }
//  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Es-tu sûr(e) de vouloir supprimer ton compte ? Cette action est irréversible.'
    )
    if (!confirmed) return

    try {
      setLoadingDelete(true)
      // 🔧 À adapter selon ton backend / AuthContext
      await delete_account()
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      setError('Impossible de supprimer le compte. Réessaie plus tard.')
    } finally {
      setLoadingDelete(false)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
      <h1>Mon profil</h1>

      <section style={{ marginBottom: 32 }}>
        <p><strong>Pseudo :</strong> {user.username}</p>
        <p><strong>Email :</strong> {user.email}</p>
      </section>
{/*
      <section style={{ marginBottom: 32 }}>
        <h2>Changer le mot de passe</h2>
        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="newPassword">Nouveau mot de passe</label><br />
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label><br />
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <button type="submit" disabled={loadingPassword}>
            {loadingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </section>
*/}
      <section>
        <h2>Zone dangereuse</h2>
        <button
          onClick={handleDeleteAccount}
          disabled={loadingDelete}
          style={{ backgroundColor: '#d32f2f', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}
        >
          {loadingDelete ? 'Suppression...' : 'Supprimer mon compte'}
		  {error && <p style={{ color: 'red' }}>{error}</p>}
        </button>
      </section>
    </div>
  )
}

export default Profile