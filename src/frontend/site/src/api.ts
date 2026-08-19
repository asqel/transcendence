// src/api.ts
const API_URL = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T>{
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
	if (res.status === 204)
		return null as T;
	console.log(res.status);
	if (!res.ok) {
		const data = await res.json().catch(() => ({}));

		throw new Error(data.detail || "Error");
	}

	return res.json();
}

export interface TokenResponse {
	access: string;
	refresh: string;
}

async function refresh_token() {
	const newTokens = await fetch(`${API_URL}/token/refresh/`, {
			"method": "POST",
			"headers": { "Content-Type": "application/json" },
			"body": JSON.stringify({"refresh":localStorage.getItem("refresh")}),
	}).then(r => r.json());
	
	localStorage.setItem("access", newTokens.access);
	// Réessaie la requête avec le nouveau token
	return newTokens;
}

function signup(username: string, password: string, email: string) {
	let body: Record<string, string> = {
		"username": username,
		"password": password,
		"email": email
	};

	let res: Promise<null> = request<null>(
			"/account/create",
			{"method": "POST", "body": JSON.stringify(body)}
		);
	return res
}

function signin(username: string, password: string) {
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
	"signup": signup,
	"signin": signin
};



export interface UserResponse {
	username: string;
	email: string;
}

function get_user() {
	let res: Promise<UserResponse> = request<UserResponse>(
		"/account/profile?username=/self",
		{method: "GET"}
	)
	return res
}

function delete_account() {
	let res: Promise<null> = request<null>(
		"/account/delete",
		{method: "POST"}
	)
	return res
}

function change_password() {
	let res: Promise<UserResponse> = request<UserResponse>(
		"/account/profile?username=/self",
		{method: "POST"}
	)
	return res
}


export const userApi = {
	"get_user" : get_user,
	"delete_account" : delete_account,
	"change_password" : change_password
};