import { BrowserRouter, Routes, Route, Navigate, useNavigate, } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home.tsx'
import NotFound from './pages/NotFound.tsx'
import Login from './pages/Login.tsx'
import PrProfile from './pages/PrProfile.tsx'
import PbProfile from './pages/PbProfile.tsx'
import PlayerSearch from './pages/PlayerSearch.tsx'
import Play from './pages/Play.tsx'
import Friends from './pages/Friends.tsx'
import ConfirmMail from './pages/ConfirmMail.tsx'
import ConfirmDelete from './pages/ConfirmDelete.tsx';
import Popups from './popups.tsx'
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import TermeOfService from './pages/TermsOfService.tsx';
import History from './pages/History.tsx';
import Leaderboard from './pages/Leaderboard.tsx';
import './App.css'

function Navigation() {
	const navigate = useNavigate();
	const { user, logout } = useAuth()
	const { t, i18n } = useTranslation();

	function handleChangeLang(e: React.ChangeEvent<HTMLSelectElement>) {
		i18n.changeLanguage(e.target.value);
		localStorage.setItem("lang", e.target.value);
	}

  return (
		<nav className="navbar">
			<div className="nav-left">
				<button onClick={() => navigate("/")}>
				  {t("navbar.home")}
				</button>

				<button onClick={() => navigate("/player-search")}>
				  {t("navbar.player_search")}
				</button>

				<button onClick={() => navigate("/leaderboard")}>
				  {t("navbar.leaderboard")}
				</button>

				<button onClick={() => navigate("/play")}>
				  {t("navbar.play")}
				</button>

				{user && (
					<button onClick={() => navigate("/friends")}>{t("navbar.friends")}</button>

				)}
				<div className="legal-button">
					<button onClick={() => navigate("/privacy-policy")}>{t("navbar.privacy-policy")}</button>
					<button onClick={() => navigate("/terme-of-service")}>{t("navbar.terme-of-service")}</button>
				</div>
    		</div>
    		<div className="nav-right">
    		    {user ? (
    		    	<div className='user'>
						<button onClick={() => navigate("/profile")}>{t("navbar.profile")}</button>
    		    		<span>{t("navbar.welcome")}, {user.username}</span>
    		    		<button className="logout" onClick={logout}>{t("navbar.logout")}</button>
    		    	</div>
    		    ) : (
					<button onClick={() => navigate("/login")}>Connexion</button>

    		    )}
				<select name="lang" value={i18n.language} onChange={handleChangeLang}>
					<option value="es">ES</option>
					<option value="en">EN</option>
					<option value="fr">FR</option>
				</select>
    		</div>
		</nav>
	);
}

// Composant pour protéger les routes
function ProtectedRoute({ children }: { children: ReactNode }) {
	const { user, loading } = useAuth()
	
	if (loading)
	return <div>Chargement...</div>
	if (!user) 
	return <Navigate to="/login" replace />
	
	return <>{children}</>
}

// Routes principales
function AppRoutes() {
	const user	= useAuth().user;

	return (
	<Routes>
		<Route path="/" element={<Home />} />
		<Route path="/player-search" element={<PlayerSearch />} />
		<Route path="/leaderboard" element={<Leaderboard />} />
		<Route path="/play/:partId?" element={<Play />} />
		<Route 
			path="/friends" 
			element={
					<ProtectedRoute>
						<Friends />
					</ProtectedRoute>
				} 
		/>
		
		<Route path="/privacy-policy" element={<PrivacyPolicy />} />
		<Route path="/terme-of-service" element={<TermeOfService />} />
		<Route 
			path="/login" 
			element={user ? <Home /> : <Login />} 
		/>
		<Route 
			path="/profile" 
			element={
					<ProtectedRoute>
						<PrProfile />
					</ProtectedRoute>
			} 
		/>
		<Route path="/profile/:username?" element={<PbProfile />} />
		<Route path="/confirm-mail" element={<ConfirmMail />} />
		<Route path="/confirm-delete" element={<ConfirmDelete />} />
				<Route 
					path="/history" 
					element={
						<ProtectedRoute>
							<History />
						</ProtectedRoute>
				} 
		/>
		<Route path="*" element={<NotFound />} />
	</Routes>
	)
}

function App() {
	const { i18n } = useTranslation();
	useEffect(() => {
 		const lang = localStorage.getItem("lang")
		if (lang)
			i18n.changeLanguage(lang);
	}, [])

	return (
		<AuthProvider>
			<BrowserRouter>
				<div className="app">
					<Navigation />
					<Popups />
					<main className="app-content">
						<AppRoutes />
					</main>
				</div>
			</BrowserRouter>
		</AuthProvider>
	)
}


export default App