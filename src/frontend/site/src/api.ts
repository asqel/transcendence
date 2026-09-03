// src/api.ts

const API_URL = "/api";


// ============================================================
// Types
// ============================================================

export interface TokenResponse {
	access: string;
	refresh: string;
}

export interface SelfUserResponse {
	username: string;
	email: string;
}

export interface OtUserResponse {
	username: string;
	join_date: string;
}


// ============================================================
// Request principale
// ============================================================

async function refresh_token(): Promise<boolean> {

	const refreshToken = localStorage.getItem("refresh");

	if (!refreshToken) {
		window.dispatchEvent(new Event("auth:logout"));
		return false;
	}

	const body = JSON.stringify({
		refresh: refreshToken,
	});

	try {
		const res = await fetch(
			`${API_URL}/token/refresh/`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body,
			},
		);
		if (!res.ok) {
			localStorage.removeItem("access");
			localStorage.removeItem("refresh");
			return false;
		}
		const data: TokenResponse = await res.json();
		localStorage.setItem("access", data.access);
		localStorage.setItem("refresh", data.refresh);
		return true;

	}
	catch {
		localStorage.removeItem("access");
		localStorage.removeItem("refresh");
		return false;
	}
}


async function request<T>(endpoint: string, method: string, body: string = "", options_extra: RequestInit = {}): Promise<T> {
	let accessToken = localStorage.getItem("access");

	function makeConfig(token: string | null): RequestInit {
		const headers = new Headers(options_extra.headers);
		headers.set("Content-Type", "application/json");
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		} else {
			headers.delete("Authorization");
		}

		return {
			...options_extra,
			method,
			...(method === "POST" ? { body } : {}),
			headers,
		};
	}

	// Première requête
	let res = await fetch(`${API_URL}${endpoint}`, makeConfig(accessToken));

	// Access token expiré
	if (res.status === 401) {

		const refreshed = await refresh_token();

		// Impossible de rafraîchir le token
		if (refreshed) {
			accessToken = localStorage.getItem("access");

			res = await fetch(`${API_URL}${endpoint}`, makeConfig(accessToken));
		}

	}

	if (!res.ok) {
		throw res.status;
	}

	if (res.status === 204) {
		return {} as T;
	}

	return res.json() as Promise<T>;
}


// ============================================================
// Auth
// ============================================================

async function create_account(username: string, password: string, email: string): Promise<void> {
	const body = JSON.stringify({
		"username": username,
		"password": password,
		"email": email,
	});

	await request<void>("/account/create", "POST", body);
}


async function get_token(username: string, password: string): Promise<void> {
	const body = JSON.stringify({
		"username": username,
		"password": password,
	});

	const res = await request<TokenResponse>("/token/", "POST", body);
	localStorage.setItem("access", res.access);
	localStorage.setItem("refresh", res.refresh);
}

// ============================================================
// User
// ============================================================

function delete_account(): Promise<null> {
	return request<null>("/account/delete", "POST");
}


function change_password(): Promise<null> {
	return request<null>("/account/profile?username=/self", "POST");
}


function get_achivments(): Promise<Array<boolean>> {
	return request<Array<boolean>>("/account/achivments", "GET");
}

// ============================================================
// Global
// ============================================================

function get_user(): Promise<SelfUserResponse>;
function get_user(user: string): Promise<OtUserResponse>;

function get_user(user: string = "/self",): Promise<SelfUserResponse | OtUserResponse> {
	return request<SelfUserResponse | OtUserResponse>(`/account/profile?username=${user}`, "GET");
}

// ============================================================
// API exports
// ============================================================

export const authApi = {
	create_account,
	get_token,
	refresh_token,
};


export const userApi = {
	get_user,
	delete_account,
	change_password,
	get_achivments,
};


export const globalApi = {
	get_user,
};
