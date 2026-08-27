// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authApi, userApi} from "../api";

interface User {
	username: string;
}

interface AuthContextType {
	user: User | null;
	loading: boolean;
	signin: (username: string, password: string) => Promise<void>;
	logout: () => void;
}



const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	async function get_name() {
		const token = localStorage.getItem("access");
		if (token){
			try {
			const data = await userApi.get_user();
			setUser({ username: data.username  });
			}
			catch (error) {
				setUser({ username: String(error) })
			}
		}
		setLoading(false);
	}

	useEffect(() => {get_name()}, [])
	
	async function set_user() {
		try {
			const data = await userApi.get_user();
			setUser({ username: data.username });
		}
		catch (error) {
			setUser({ username: String(error) })
		}
	}

	async function signin(username: string, password: string): Promise<void> {
		await authApi.get_token(username, password);
		await set_user();
	};


	function logout() {
		localStorage.removeItem("access");
		localStorage.removeItem("refresh");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{user, loading, signin, logout}}>
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