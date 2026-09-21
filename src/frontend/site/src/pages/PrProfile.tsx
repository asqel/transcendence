
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { userApi, type SelfResponse, type UserResponse } from "../api";
import { useTranslation } from 'react-i18next';
import countries from "../data/countries.json";
import "./PrProfile.css"
function Profile() {
	const {t} = useTranslation();

	const { logout } = useAuth();

	const [self, setSelf] = useState<SelfResponse | null>(null);
	const [user, setUser] = useState<UserResponse | null>(null);
	const [bio, setBio] = useState<string>("");
	const [country, setCountry] = useState<string>("");
	const [error, setError] = useState<string | null>(null)
	const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
	const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

	// Popup de suppression
	const [showDeletePopup, setShowDeletePopup] = useState<boolean>(false);
	const [deletePassword, setDeletePassword] = useState<string>("");
	const [deleteError, setDeleteError] = useState<string | null>(null);

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

	// Ouvre la popup
	function openDeletePopup() {
		setDeletePassword("")
		setDeleteError(null)
		setShowDeletePopup(true)
	}

	// Ferme la popup
	function closeDeletePopup() {
		if (loadingDelete)
			return

		setShowDeletePopup(false)
		setDeletePassword("")
		setDeleteError(null)
	}

	// Suppression du compte
	async function handleDeleteAccount() {
		if (!self?.email_confirmed && !deletePassword) {
			setDeleteError("Veuillez entrer votre mot de passe.")
			return
		}

		try {
			setLoadingDelete(true)
			setDeleteError(null)
			await userApi.delete_account()
			logout()
		}
		catch (err) {
			setDeleteError("Mot de passe incorrect ou erreur lors de la suppression.")
		}
		finally {
			setLoadingDelete(false)
		}
	}

	useEffect(() => {
		fetchProfile()
	}, [])

	if (loadingProfile) {
		return (
			<div className="profile-page profile-loading">
				{t("text.loading_profile")}
			</div>
		)
	}

	if (error || !self || !user) {
		return (
			<div className="profile-page profile-error">
				{error}
			</div>
		)
	}

	return (
		<div className="profile-page">
			<h1>Mon profil</h1>

			<section className="profile-section">
				<p><strong>Pseudo :</strong> {self.username}</p>

				<p>
					<strong>Email :</strong> {self.email}
					{!self.email_confirmed && (
						<button
							className="confirm-mail-button"
							onClick={handleSendMail}
						>
							Confirmer le mail
						</button>
					)}
				</p>

				<p><strong>Bio :</strong></p>

				<textarea
					className="bio-textarea"
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					onKeyDown={handleBioKeyDown}
					maxLength={100}
				/>

				<p className="bio-counter">{bio.length} / 100</p>

				<select className="country-select" value={country} onChange={handleCountryChange}>
						{countries.map((c) => (
							<option key={c.code} value={c.code}>
								({c.code}) {c.name} {c.flag}
							</option>
						))}
				</select>
			</section>

			<section className="danger-zone">
				<h2>Zone dangereuse</h2>

				<button
					className="delete-account-button"
					onClick={openDeletePopup}
					disabled={loadingDelete}
				>
					Supprimer mon compte
				</button>
			</section>

			{/* POPUP DE SUPPRESSION */}
			{showDeletePopup && (
				<div className="delete-modal-overlay" onClick={closeDeletePopup}>
					<div className="delete-modal" onClick={(e) => e.stopPropagation()}>
						{!self.email_confirmed && (
							<>
								<h2>Supprimer votre compte ?</h2>
								<p>
									Cette action est <strong>irréversible</strong>.
									<br />
									Veuillez entrer votre mot de passe pour confirmer.
								</p>
								<input
									type="password"
									className="delete-password-input"
									placeholder="Mot de passe"
									value={deletePassword}
									onChange={(e) => {
										setDeletePassword(e.target.value)
										setDeleteError(null)
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											handleDeleteAccount()
										}
									}}
									autoFocus
									disabled={loadingDelete}
								/>
								{deleteError && (
									<p className="delete-modal-error">
										{deleteError}
									</p>
								)}
							</>
						)}
						{self.email_confirmed && (
							<p>Email will be send to delete account</p>
						)}
						<div className="delete-modal-actions">
							<button
								className="delete-cancel-button"
								onClick={closeDeletePopup}
								disabled={loadingDelete}
							>
								Annuler
							</button>
							<button
								className="delete-confirm-button"
								onClick={handleDeleteAccount}
								disabled={loadingDelete || (!self.email_confirmed && !deletePassword)}
							>
								{loadingDelete ?
									("Suppression...")
									:
									("Supprimer définitivement")
								}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Profile

