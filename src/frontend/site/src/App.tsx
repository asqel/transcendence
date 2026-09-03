import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home.tsx'
import About from './pages/About.tsx'
import Contact from './pages/Contact.tsx'
import NotFound from './pages/NotFound.tsx'
import Login from './pages/Login.tsx'
import Profile from './pages/Profile.tsx'
import PlayerPages from './pages/PlayerPages.tsx'
import PlayerSearch from './pages/PlayerSearch.tsx'
import Play from './pages/Play.tsx'
import Achivments from './pages/Achivments.tsx'

import './App.css'


// Navigation avec affichage conditionnel
function Navigation() {
  const { user, logout } = useAuth()

  return (
	<nav>
	  <Link to="/">Accueil</Link>
	  <Link to="/about">À propos</Link>
	  <Link to="/contact">Contact</Link>
	  <Link to="/playerSearch">PlayerSearch</Link>
	  {user ? (
		<>
			<Link to="/profile">Profile</Link>
			<span style={{ marginLeft: 20 }}>Bonjour, {user.username}</span>
			<button onClick={logout} style={{ marginLeft: 10 }}>
				Déconnexion
			</button>
		</>
	  ) : (
		<Link to="/login" style={{ marginLeft: 20 }}>Connexion</Link>
	  )}
	</nav>
  )
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
  const user  = useAuth().user;

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
    				<Profile />
    			</ProtectedRoute>
  			} 
		/>
		<Route 
  			path="/achivments" 
			element={
    			//<ProtectedRoute>
    				<Achivments />
    			//</ProtectedRoute>
  			} 
		/>
		<Route path="/profile/:username" element={<PlayerPages />} />
		<Route path="/about" element={<About />} />
		<Route path="/contact" element={<Contact />} />
		<Route path="/playerSearch" element={<PlayerSearch />} />
		<Route path="/play/:partId?" element={<Play />} />
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
				<Navigation />
				<AppRoutes />
			</BrowserRouter>
		</AuthProvider>
	)
}

export default App