// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api";

interface User {
	username: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	function useEffect_func() {
		const token = localStorage.getItem("access");
		if (token)
			setUser({ username: "connected" }); // Simplifié, tu peux appeler /user/profile/
		setLoading(false);
	}
	useEffect(useEffect_func, []);

	async function login(username: string, password: string) {
		const data = await authApi.login(username, password);
		localStorage.setItem("access", data.access);
		localStorage.setItem("refresh", data.refresh);
		setUser({ username });
	};

	function logout() {
		localStorage.removeItem("access");
		localStorage.removeItem("refresh");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, loading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) 
		throw new Error("useAuth must be used within AuthProvider");
	return context;
};