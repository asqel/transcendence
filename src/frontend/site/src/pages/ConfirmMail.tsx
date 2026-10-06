import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { userApi } from "../api";

function ConfirmMail() {
	const[t] = useTranslation();
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
				await userApi.confirm_mail(token, username);
			}
			catch (error) {
				setError(true);
			}
			finally {
				setLoading(false)
				navigate("/")
			}
			
	}

	return (
		<div style={{display: "flex", justifyContent: "center", margin: "20%"}}>
			<button onClick={sendConfirm}>{loading ? t("loading") : t("confirm")}</button>
			{error && <p>{t("error.default")}</p>}
		</div>
	)
	
}


export default ConfirmMail