import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home.tsx'
import About from './pages/About.tsx'
import Contact from './pages/Contact.tsx'
import NotFound from './pages/NotFound.tsx'
import Login from './pages/Login.tsx'
import PrProfile from './pages/PrProfile.tsx'
import PbProfile from './pages/PbProfile.tsx'
import PlayerSearch from './pages/PlayerSearch.tsx'
import Play from './pages/Play.tsx'
import Friends from './pages/Friends.tsx'
import Achievements from './pages/Achievements.tsx'
import ConfirmMail from './pages/ConfirmMail.tsx'
import Popups from './popups.tsx'
import './App.css'

function Navigation() {
	const { user, logout } = useAuth()
	const { i18n } = useTranslation();

	function handleChangeLang(e: React.ChangeEvent<HTMLSelectElement>) {
		i18n.changeLanguage(e.target.value);
	}

  return (
		<nav className="navbar-desktop">
			<div className="nav-left">
    		    <Link to="/">Accueil</Link>
    		    <Link to="/about">À propos</Link>
    		    <Link to="/contact">Contact</Link>
    		    <Link to="/playerSearch">PlayerSearch</Link>
				<Link to="/play">Play</Link>
				{user && (
					<>
					<Link to="/achievements">Achievements</Link>
					<Link to="/friends">Friends</Link>
					</>
				)}
				
    		</div>
    		<div className="nav-right">
    		    {user ? (
    		    	<>
    		    	<Link to="/profile">Profile</Link>
    		    	<span>Bonjour, {user.username}</span>
    		    	<button onClick={logout}>Déconnexion</button>
    		    	</>
    		    ) : (
    		    	<Link to="/login">Connexion</Link>
    		    )}
				<select name="lang" value={i18n.language} onChange={handleChangeLang}>
					<option value="es">Espagnol</option>
					<option value="en">English</option>
					<option value="fr">Francais</option>
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
		<Route 
			path="/" 
			element={
				<ProtectedRoute>
					<Home />
				</ProtectedRoute>
			} 
		/>
		<Route 
				path="/profile" 
			element={
					<ProtectedRoute>
						<PrProfile />
					</ProtectedRoute>
				} 
		/>
		<Route 
				path="/achievements" 
			element={
					<ProtectedRoute>
						<Achievements />
					</ProtectedRoute>
				} 
		/>
		<Route 
				path="/friends" 
			element={
					<ProtectedRoute>
						<Friends />
					</ProtectedRoute>
				} 
		/>
		<Route path="/profile/:username?" element={<PbProfile />} />
		<Route path="/about" element={<About />} />
		<Route path="/contact" element={<Contact />} />
		<Route path="/playerSearch" element={<PlayerSearch />} />
		<Route path="/play/:partId?" element={<Play />} />
		<Route path="/confirm-mail" element={<ConfirmMail />} />
		<Route 
			path="/login" 
			element={user ? <Navigate to="/" replace /> : <Login />} 
		/>
		
		<Route path="*" element={<NotFound />} />
	</Routes>
	)
}

function App() {
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