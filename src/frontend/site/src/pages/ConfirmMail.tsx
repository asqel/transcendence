import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"
import { userApi } from "../api";

function ConfirmMail() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [loading, setLoading] = useState<boolean>(false);

	const token = searchParams.get("token")
	const username = searchParams.get("username")

	async function sendConfirm() {
		if (!token || !username)
			navigate("/404");
		else
			try {
				setLoading(true)
				await userApi.confirm_mail(token, username);
			}
			catch {
				navigate("/404");
			}
			finally {
				setLoading(false)
			}
			
	}

	useEffect(() => {sendConfirm()}, []);

	if (loading)
		return (
			<div>loading</div>
		)
	else
		return (
			<div>succes</div>
		)
	
}


export default ConfirmMail