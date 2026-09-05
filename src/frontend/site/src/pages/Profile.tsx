import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userApi, type SelfResponse, type UserResponse } from "../api";
import { useTranslation } from 'react-i18next';
import { countries, getEmojiFlag, type TCountryCode } from "countries-list"
import "./Profile.css"

 function Profile() {
	const {t} = useTranslation()

	const { logout } = useAuth()
	const navigate = useNavigate()

	const [self, setSelf] = useState<SelfResponse | null>(null);
	const [user, setUser] = useState<UserResponse | null>(null);
	const [bio, setBio] = useState<string>("");
	const [country, setCountry] = useState<string>("");
	const [error, setError] = useState<string | null>(null)
	const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
	const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

	const myCountries = {
		...countries,
		LG: {
			name: "Listenbourg",
			native: "Listenbourg",
		},
	}

	async function fetchProfile() {
		try {
			setLoadingProfile(true)
			const rec_self = await userApi.get_user()
			setSelf(rec_self)
			const rec_user = await userApi.get_user(rec_self.username)
			setUser(rec_user);
			setBio(rec_user.bio);
			setCountry(rec_user.country);
		}
		catch (err) {
			setError(t("error.loading_profile"))
		}
		finally {
			setLoadingProfile(false)
		}
	}

	async function handleSendMail() {
			await userApi.send_confirm_mail()
	}

	
	async function handleBioKeyDown(
		e: React.KeyboardEvent<HTMLTextAreaElement>
	) {
		if (e.key === "Enter") {
			e.preventDefault()
			try {
				await userApi.change_bio(bio);

			}
			catch {

			}
		}
	}

	async function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const newCountry = e.target.value
		
		try {
			await userApi.change_country(newCountry)
			setCountry(newCountry)
		}
		catch {
		}
	}

	async function handleDeleteAccount() {
		const confirmed = window.confirm(
			t("text.confirm_account_deletion")
		)
		if (!confirmed)
			return

		try {
			setLoadingDelete(true)
			await userApi.delete_account();
			logout()
			navigate('/login', { replace: true })
		}
		catch (err) {
			setError(t("error.delete_account"))
		}
		finally {
			setLoadingDelete(false)
		}
	}

	useEffect(() => {fetchProfile()}, [])

	if (loadingProfile) {
		return <div style={{ maxWidth: 480, margin: '40px auto' }}>{t("text.loading_profile")}</div>
	}

	if (error || !self || !user) {
		return <div style={{ maxWidth: 480, margin: '40px auto', color: 'red' }}>{error}</div>
	}

	return (
	<div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
		<h1>Mon profil</h1>

		<section style={{ marginBottom: 32 }}>
			<p><strong>Pseudo :</strong> {self.username}</p>
			<p><strong>Email :</strong> {self.email}</p>
			{!self.email_confirmed && <button onClick={handleSendMail}>Confirmer le mail</button>}
			<p><strong>Bio :</strong></p>
			<textarea
				value={bio}
				onChange={(e) => setBio(e.target.value)}
				onKeyDown={handleBioKeyDown}
				maxLength={100}
			/>
			<p>{bio.length} / 100</p>
			<select
				value={country}
				onChange={handleCountryChange}
			>
				{Object.entries(myCountries).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([code, country]) => (
					<option key={code} value={code}>
						{code === "LG" ? getEmojiFlag("FR") : getEmojiFlag(code as TCountryCode)}{" "}
						{country.name} ({code})
					</option>
				))}
			</select>
		</section>
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