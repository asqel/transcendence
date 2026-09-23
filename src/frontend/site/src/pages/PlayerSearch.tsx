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
		if (!query.trim() || error)
			return
		try {
			await globalApi.get_user(query.trim());
			navigate(`/profile/${encodeURIComponent(query.trim())}`);
		}
		catch (err) {
			if (err == 404)
				setError(t("player_search-page.error.not_found"))
		}
	}


	return (
			<div className="container">
				<h1 className="title">{t("player_search-page.find_player")}</h1>
					<div className="search-wrapper">
						<input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => {
							if (e.key === "Enter") handleSearch()
							}}
							placeholder={t("player_search-page.username")}
							className="input"
						/>
						<button onClick={handleSearch}>{t("player_search-page.find")}</button>
						{error && (
							<p className="search-error">{error}</p>
						)}
					</div>
		</div>
	);
}