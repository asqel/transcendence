import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from '../context/AuthContext'
import { userApi } from "../api";

function ConfirmDelete() {
	const { logout } = useAuth()
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<boolean>(false);

	const token = searchParams.get("token")
	const username = searchParams.get("username")

	async function sendConfirm() {
		if (!token || !username)
			navigate("/404");
		else
			try {
				setLoading(true)
				await userApi.confirm_delete(token, username);
			}
			catch (error) {
				setError(true);
			}
			finally {
				setLoading(false)
				logout();
				navigate("/")
			}
			
	}

	return (
		<div style={{display: "flex", justifyContent: "center", margin: "20%"}}>
			<button onClick={sendConfirm}>{loading ? "loading" : "confirm"}</button>
			{error && <p>error</p>}
		</div>
	)
	
}

export default ConfirmDelete