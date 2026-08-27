// src/api.ts
const API_URL = "/api";

async function request<T>(endpoint: string, method: string, body: string = "", options_extra: RequestInit = {}): Promise<T> {
	const token: string | null = localStorage.getItem("access");

	const config: RequestInit = {
		...options_extra,
		method,
		...(method === "POST" ? {body} : {}),
		headers: {
			"Content-Type": "application/json",
			...(token ? { "Authorization": `Bearer ${token}` } : {}),
			...options_extra.headers,
		},
	};

	const res = await fetch(`${API_URL}${endpoint}`, config);


	if (res.status === 401) {
		refresh_token();
		const config: RequestInit  = {
			...options_extra,
			method,
			...(method === "POST" ? {body} : {}),
			headers: {
				"Content-Type": "application/json",
				...(token ? { "Authorization": `Bearer ${token}` } : {}),
				...options_extra.headers,
			},
		};
		const res = await fetch(`${API_URL}${endpoint}`, config);
		if (!res.ok) {
			throw res.status;
		}
		return res.json().catch(() => {return {};});
	}

	if (!res.ok) {
		throw res.status;
	}
	return res.json().catch(() => {return {};});
}

export interface TokenResponse {
	access: string;
	refresh: string;
}

async function refresh_token(): Promise<void> {
	const refreshToken: string | null = localStorage.getItem("refresh")
	if (!refreshToken)
		return;
	const body: Record<string, string> = {
		"access": refreshToken
	};
	const res: TokenResponse = await request<TokenResponse>("/token/refresh", "POST", JSON.stringify(body));
	if (!res)
		return;
	localStorage.setItem("access", res.access);
	localStorage.setItem("refresh", res.refresh);
}

async function create_account(username: string, password: string, email: string): Promise<void> {
	const body: Record<string, string> = {
		"username": username,
		"password": password,
		"email": email
	};

	await request<null>("/account/create", "POST", JSON.stringify(body));
}

async function get_token(username: string, password: string): Promise<void> {
	let body: Record<string, string> = {
		"username": username,
		"password": password
	};

	const res: TokenResponse = await request<TokenResponse>("/token/", "POST", JSON.stringify(body));
	localStorage.setItem("access", res.access);
	localStorage.setItem("refresh", res.refresh);
}


export const authApi = {
	"create_account": create_account,
	"get_token": get_token,
	"refresh_token": refresh_token
};



export interface UserResponse {
	username: string;
	email: string;
	join_date: string
};

function get_user(user: string = "/self"): Promise<UserResponse> {
	let res: Promise<UserResponse> = request<UserResponse>(`/account/profile?username=${user}`, "GET")
	return res;
}

function delete_account(): Promise<null> {
	let res: Promise<null> = request<null>("/account/delete", "POST")
	return res;
}

function change_password(): Promise<UserResponse> {
	let res: Promise<UserResponse> = request<UserResponse>("/account/profile?username=/self", "POST")
	return res;
}


export const userApi = {
	"get_user" : get_user,
	"delete_account" : delete_account,
	"change_password" : change_password
};

export const globalApi = {
	"get_user" : get_user,
};