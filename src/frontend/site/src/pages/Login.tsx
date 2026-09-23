// src/pages/Login.tsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authApi } from "../api";
import { useTranslation } from 'react-i18next';
import './Login.css'

function Login() {

	const {t} = useTranslation()

	const [mode, setMode] = useState<"signin" | "register">("signin")

	const [username, setUsername] = useState<string>("")
	const [email, setEmail] = useState<string>("")
	const [password, setPassword] = useState<string>("")
	const [confirmPassword, setConfirmPassword] = useState<string>("")

	const [error, setError] = useState<string>("")
	const [loading, setLoading] = useState<boolean>(false)

	const { signin } = useAuth()
	const navigate = useNavigate()

	async function handleSubmit (e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			if (mode === 'signin') {
				await signin(username, password)
			}
			else {
				if (password !== confirmPassword)
					throw(462)
				await authApi.create_account(username, password, email)
				await signin(username, password)
			}
			navigate('/')
		}
		catch (err) {
			setError(t(`login-page.error.${err}`, {defaultValue: t("error.defaut")}))
		}
		finally {
			setLoading(false)
		}
	}

	return (
		<div className='page-login'>
			<div className="mode-switch">
				<button
					type="button"
					onClick={() => setMode('signin')}
					className={mode === 'signin' ? 'active' : ''}
				>
					{t("login-page.signin")}
				</button>
				<button
					type="button"
					onClick={() => setMode('register')}
					className={mode === 'register' ? 'active' : ''}
				>
					{t("login-page.signup")}
				</button>
			</div>

			<form onSubmit={handleSubmit} className="login-form">
				<input
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder={t("login-page.username")}
					required
				/>
				{mode === 'register' && (
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder={t("login-page.email")}
						required
					/>
				)}

				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder={t("login-page.password")}
					required
				/>

				{mode === 'register' && (
					<input
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					placeholder={t("login-page.confirm_password")}
					required
					/>
				)}

				<button type="submit" disabled={loading}>
					{loading
					? '...'
					: mode === 'signin'
					? t("login-page.to_signin")
					: t("login-page.to_signup")}
				</button>
				{error && <p className="login-error">{error}</p>}
			</form>
		</div>
	)
}

export default Login