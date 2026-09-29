
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { userApi, type SelfResponse, type UserResponse } from "../api";
import { useTranslation } from 'react-i18next';
import countries from "../data/countries.json";
import achievements from "../data/achievements.json";
import "./PrProfile.css"
import { useNavigate } from 'react-router-dom';
function Profile() {
	const {t} = useTranslation();
	const navigate = useNavigate();

	const { logout } = useAuth();

	const [self, setSelf] = useState<SelfResponse | null>(null);
	const [user, setUser] = useState<UserResponse | null>(null);
	const [bio, setBio] = useState<string>("");
	const [country, setCountry] = useState<string>("");
	const [error, setError] = useState<string | null>(null)
	const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

	const [loadingConfirmMail, setLoadingConfirmMail] = useState<boolean>(false);
	const [sendConfirmMail, setSendCofirmMail] = useState<boolean>(false);
	const [confirmMailError, setcofirmMailError] = useState<boolean>(false);

	const [achievementList, setAchievementList] = useState<boolean[]>([])
	const [selectedSkin, setSelectedSkin] = useState(0)

	const [loadingSkin, setLoadingSkin] = useState<number | null>(null)
	// Popup de suppression
	const [showDeletePopup, setShowDeletePopup] = useState<boolean>(false);
	const [deletePassword, setDeletePassword] = useState<string>("");
	const [loadingDelete, setLoadingDelete] = useState<boolean>(false);
	const [deleteDone, setDeleteDone] = useState<boolean>(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	async function fetchProfile() {
		try {
			setLoadingProfile(true)
			console.log("getting user");
			const rec_self = await userApi.get_user()
			console.log(rec_self);
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

	async function loadAchievements() {
		try {
			const list = await userApi.get_achivments();
			setAchievementList(list);
			const skin = await userApi.get_skin();
			setSelectedSkin(skin.skin);
		}
		catch (error) {
			console.error(error)
		}
	}

	async function handleSendMail() {
		try {
			setLoadingConfirmMail(true);
			await userApi.send_confirm_mail();
		}
		catch {
			setcofirmMailError(true);
		}
		finally {
			setLoadingConfirmMail(false);
			setSendCofirmMail(true);
		}
	}

	async function handleBioKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter") {
			e.preventDefault()
			try {
				await userApi.change_bio(bio);
			}
			catch {
			}
		}
	}

	async function handleBioBlur() {
		try {
			await userApi.change_bio(bio);
		}
		catch {
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

	async function handleSelectSkin(index: number) {
		if (!achievementList[index])
			return
		try {
			setLoadingSkin(index)
			await userApi.set_skin(index)
			setSelectedSkin(index)
		}
		catch (error) {
			console.error(error)
		}
		finally {
			setLoadingSkin(null)
		}
	}

	async function downloadData() {
		try {
			const blob = await userApi.download_data();

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");

			a.href = url;
			a.download = "data.json";
			a.click();

			URL.revokeObjectURL(url);
		}
		catch {}
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
			setDeleteDone(false);
			setLoadingDelete(true);
			setDeleteError(null);
			await userApi.delete_account();
			if (!self?.email_confirmed)
				logout();
		}
		catch (err) {
			setDeleteError("Mot de passe incorrect ou erreur lors de la suppression.");
		}
		finally {
			setLoadingDelete(false);
			setDeleteDone(true);
		}
	}

	useEffect(() => {
		fetchProfile();
		loadAchievements();
		window.addEventListener("achievements:new", loadAchievements);
		return () => {
			window.removeEventListener("achievements:new", loadAchievements);
		};
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
			<section className="profile-section">
				<h1>Mon profil</h1>
				<section className="profile">
					<div><strong>Pseudo :</strong> {self.username}</div>
					<div>
						<strong>Email :</strong> {self.email}
						{!self.email_confirmed && (
							<button
								className="confirm-mail-button"
								onClick={handleSendMail}
								disabled={loadingConfirmMail}
							>
								{confirmMailError ? "Email deja envoyer" : (sendConfirmMail ? "Email envoyer!" : "Envoyer le mail")}
							</button>
						)}
					</div>
					<div>
						<strong>Bio :</strong>
						<br />
						<textarea
							className="bio-textarea"
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							onKeyDown={handleBioKeyDown}
							onBlur={handleBioBlur}
							maxLength={100}
						/>
					</div>
					<div className="bio-counter">{bio.length} / 100</div>
					<select className="country-select" value={country} onChange={handleCountryChange}>
							{countries.map((c) => (
								<option key={c.code} value={c.code}>
									({c.code}) {c.name} {c.flag}
								</option>
							))}
					</select>
					<button onClick={() => navigate("/history")}>History</button>
				</section>
				<section className="data-zone">
					<button
						className="dl-data-button"
						onClick={downloadData}
					>
						Telecharger ces data
					</button>
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
			</section>
			<section className="achievements-section">
				<h1>test</h1>
				<div className="achievements">
				{achievements.map((achievement, index) => {
					const unlocked = achievementList[index]
					const selected = index === selectedSkin
					return (
						<button
							key={index}
							className={`achievement ${selected ? "achievement-selected" : ""}`}
							onClick={() => handleSelectSkin(index)}
							disabled={!unlocked || loadingSkin !== null}
						>
							<img
								src={achievement.image}
								alt={t("achievements." + index + ".name")}
								className="achievement-image"
							/>
	
							<div className="achievement-info">
								<h3>{t("achievements." + index + ".name")}</h3>
								<p>{t("achievements." + index + ".des")}</p>
							</div>
							{selected && (
								<span className="achievement-check">✓</span>
							)}
						</button>
					)
				})}
				</div>
			</section>
			

			{/* POPUP DE SUPPRESSION */}
			{showDeletePopup && (
				<div className="delete-modal-overlay" onClick={closeDeletePopup}>
					<div className="delete-modal" onClick={(e) => e.stopPropagation()}>
						<>
						<h2>Supprimer votre compte ?</h2>
						<p>
							Cette action est <strong>irréversible</strong>.
						</p>
						<p>
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
						{deleteDone && (
							<p className="delete-modal-done">
								Email send
							</p>
						)}
						{deleteError && (
							<p className="delete-modal-error">
								{deleteError}
							</p>
						)}
						</>
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
								disabled={loadingDelete}
							>
								{loadingDelete ? ("Suppression...") : ("Supprimer definitinvement")}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Profile

