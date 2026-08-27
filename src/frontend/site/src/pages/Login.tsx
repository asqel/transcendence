// src/pages/Login.tsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { authApi } from "../api";
import { useTranslation } from 'react-i18next';
import './Login.css'

function Login() {

	const {t} = useTranslation()

	const [mode, setMode] = useState<'signin' | 'register'>('signin')

	const [username, setUsername] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

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
				throw new Error(t("error.pass_not_match"))
			await authApi.create_account(username, password, email)
			await signin(username, password)
		}
		navigate('/')
	}
	catch (err) {
		if (err === 409)
			setError(t("error.username_already_used"))
		else if (err === 460)
			setError(t("error.incorrect_username"))
		else if (err === 461)
			setError(t("error.pass_weak"))
		else
			setError(t("error.wrong"))
	}
	finally {
		setLoading(false)
	}
	}

	return (
	<div>
		<h1>{mode === 'signin' ? t("text.signin") : t("text.signup")}</h1>

		<div className="mode-switch">
		<button
			type="button"
			onClick={() => setMode('signin')}
			className={mode === 'signin' ? 'active' : ''}
		>
			{t("text.signin")}
		</button>
		<button
			type="button"
			onClick={() => setMode('register')}
			className={mode === 'register' ? 'active' : ''}
		>
			{t("text.signup")}
		</button>
		</div>

		<form onSubmit={handleSubmit} className="login-form">
			<input
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				placeholder="Nom d'utilisateur"
			/>
			{mode === 'register' && (
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder={t("text.mail")}
					required
				/>
			)}

			<input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder={t("text.password")}
				required
			/>

			{mode === 'register' && (
				<input
				type="password"
				value={confirmPassword}
				onChange={(e) => setConfirmPassword(e.target.value)}
				placeholder={t("text.confirm_password")}
				required
				/>
			)}

			<button type="submit" disabled={loading}>
				{loading
				? '...'
				: mode === 'signin'
				? t("text.signin")
				: t("text.signup")}
			</button>

			{error && <p className="login-error">{error}</p>}
		</form>
	</div>
	)
}

export default Login