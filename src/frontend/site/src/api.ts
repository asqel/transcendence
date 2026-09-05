// src/api.ts

const API_URL = "/api";


// ============================================================
// Types
// ============================================================

export interface TokenResponse {
	access: string;
	refresh: string;
}

export interface SelfResponse {
	username: string;
	email: string;
	email_confirmed: boolean
}

export interface UserResponse {
	bio: string;
	country: string;
	join_date: string;
	win_count: number;
	loss_count: number;
	placed: number;
	streak: number;
}

export interface SkinResponse {
	skin: number;
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

function send_confirm_mail(): Promise<null> {
	return request<null>("/account/confirm-ask", "GET");
}

function confirm_mail(token: string, username: string): Promise<null> {
	return request<null>(`/account/confirm?token=${token}&username=${username}`, "GET")
}

function change_bio(bio: string): Promise<null> {
	const body = JSON.stringify({
		"field": "bio",
		"value": bio,
	});
	return request<null>(`/account/set-info`, "POST", body)
}

function change_country(country: string): Promise<null> {
	const body = JSON.stringify({
		"field": "country",
		"value": country,
	});
	return request<null>(`/account/set-info`, "POST", body)
}

function delete_account(): Promise<null> {
	return request<null>("/account/delete", "POST");
}


function change_password(): Promise<null> {
	return request<null>("/account/profile?username=/self", "POST");
}


function get_achivments(): Promise<Array<boolean>> {
	return request<Array<boolean>>("/achievements", "GET");
}

function set_skin(id: number): Promise<null> {
	const body = JSON.stringify({
		"skin": id,
	});
	return request<null>("/account/set-skin", "POST", body);
}

function get_skin(): Promise<SkinResponse> {
	return request<SkinResponse>("/account/get-skin", "GET");
}

// ============================================================
// Global
// ============================================================

function get_user(): Promise<SelfResponse>;
function get_user(user: string): Promise<UserResponse>;

function get_user(user: string = "/self",): Promise<SelfResponse | UserResponse> {
	return request<SelfResponse | UserResponse>(`/account/profile?username=${user}`, "GET");
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
	confirm_mail,
	send_confirm_mail,
	change_bio,
	change_country,
	delete_account,
	change_password,
	get_achivments,
	set_skin,
	get_skin,
};


export const globalApi = {
	get_user,
};
