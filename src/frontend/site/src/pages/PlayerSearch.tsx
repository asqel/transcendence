import { useState } from "react";
import { useNavigate } from 'react-router-dom'
import { globalApi } from "../api";
import { useTranslation } from 'react-i18next';
import "./PlayerSearch.css";

export default function UserSearchPage() {
	const {t} = useTranslation()

	const [query, setQuery] = useState<string>("");
	const [error, setError] = useState<string>("");

	const navigate = useNavigate()

	async function handleSearch() {
		try {
			await globalApi.get_user(query);
			navigate(`/profile/${encodeURIComponent(query.trim())}`);
		}
		catch (err) {
			if (err == 404)
				setError("Not found")
		}
	}


	return (
			<div className="container">
				<h1 className="title">{t("text.find_player")}</h1>
					<div className="search-wrapper">
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => {
							if (e.key === "Enter") handleSearch()
							}}
							placeholder={t("text.player_name")}
							className="input"
						/>
						{error && (
							<p>{error}</p>
						)}
						<button onClick={handleSearch}>{t("text.find")}</button>
					</div>
		</div>
	);
}