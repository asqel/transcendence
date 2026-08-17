// src/api.ts
const API_URL = "/api";

function refresh(refreshToken: string) {
	let res: Promise<TokenResponse> = request<TokenResponse>(
			"/token/refresh/",
			{method: "POST", body: JSON.stringify({ refresh: refreshToken })}
		);
	return res;

}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	// 1. Récupère le token depuis le localStorage
	const token: string|null = localStorage.getItem("access");

	// 2. Construit les headers
	const headers = {
		"Content-Type": "application/json",
		...(token ? {"Authorization": `Bearer ${token}`} : {}),
		...options.headers,
	};

	// 4. Envoie la requête
	const res = await fetch(`${API_URL}${endpoint}`, {...options, headers});

	// 5. Si le token est expiré (401), on pourrait le refresh ici
	if (res.status === 401 && localStorage.getItem("refresh")) {

	// Logique de refresh automatique
		const newTokens = await fetch(`${API_URL}/token/refresh/`, {
				"method": "POST",
				"headers": { "Content-Type": "application/json" },
				"body": JSON.stringify(localStorage.getItem("refresh")),
		}).then(r => r.json());
		
		localStorage.setItem("access", newTokens.access);
		// Réessaie la requête avec le nouveau token
		return request(endpoint, options);
	}
	

	if (!res.ok) {
	const data = await res.json().catch(() => ({}));
	throw new Error(data.detail || "Erreur réseau");
	}

	return res.json();
}

export interface TokenResponse {
	access: string;
	refresh: string;
}


function signin(username: string, password: string, email: string) {
	let body: Record<string, string> = {
		"username": username,
		"password": password,
		"email": email
	};

	let res: Promise<TokenResponse> = request<TokenResponse>(
			"/account/create",
			{"method": "POST", "body": JSON.stringify(body)}
		);
	return res
}

function login(username: string, password: string) {
	let body: Record<string, string> = {
		"username": username,
		"password": password
	};

	let res: Promise<TokenResponse> = request<TokenResponse>(
			"/token/",
			{method: "POST", body: JSON.stringify(body)}
		);
	return res;
}


export const authApi = {
	"signin": signin,
	"login": login,
};

// Exemple d'appel protégé
export const userApi = {
	getProfile() {
	return request<{ username: string; email: string }>("/user/profile/");
	},
};