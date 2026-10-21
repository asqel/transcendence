import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next';
import "./Home.css"

function Home() {
	const navigate = useNavigate();
	const [t] = useTranslation();
	const {user} = useAuth();

	return (
		<div className="home-page">
			<h1>{t("home.title")}</h1>
			<div className="elements">
				<p>{t("home.intro")}</p>
				<h2>{t("home.rules_title")}</h2>
				<p>{t("home.rules")}</p>
				<p>{t("home.dontworry")}</p>
				<p>{t("home.have_fun")}</p>
				{user ? (
					<>
						<p>{t("home.can_play")}</p>
						<button onClick={() => navigate("/play")}>{t("home.play")}</button>
					</>
				):(
					<>
						<p>{t("home.can_login")}</p>
						<button onClick={() => navigate("/login")}>{t("home.login")}</button>
					</>
				)}
			</div>
		</div>
	)
}

export default Home