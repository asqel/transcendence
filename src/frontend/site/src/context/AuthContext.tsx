// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi, userApi,  type UserResponse, type TokenResponse} from "../api";

interface User {
	username: string;
	email: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	signin: (username: string, password: string) => Promise<void>;
	signup: (username: string, password: string, email: string) => Promise<void>;
	delete_account: () => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	function useEffect_func() {
		async function async_part() {
		const token = localStorage.getItem("access");
		if (token){
			try {
			const data = await userApi.get_user();
			setUser({ username: data.username, email: data.email });
			}
			catch (error) {
				setUser({ username: String(error), email: "" })
			}
		}
		setLoading(false);
		}
		async_part();
	}

	useEffect(useEffect_func, []);

	async function signin(username: string, password: string) {
		let data: TokenResponse|UserResponse = await authApi.signin(username, password);
		localStorage.setItem("access", data.access);
		localStorage.setItem("refresh", data.refresh);

		data = await userApi.get_user();
		setUser({ username: data.username, email: data.email });
	};

	async function signup(username: string, password: string, email: string) {
		await authApi.signup(username, password, email);
	};


	function logout() {
		localStorage.removeItem("access");
		localStorage.removeItem("refresh");
		setUser(null);
	};


	async function delete_account() {
		await userApi.delete_account();
		logout();
	};

	return (
		<AuthContext.Provider value={{user, loading, signin, signup, delete_account, logout}}>
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