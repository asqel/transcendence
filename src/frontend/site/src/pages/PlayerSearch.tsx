import { useState } from "react";
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import "./PlayerSearch.css";

export default function UserSearchPage() {
  const {t} = useTranslation()

  const [query, setQuery] = useState<string>("");

  const navigate = useNavigate()

  function handleSearch() {
    navigate(`/profile/${encodeURIComponent(query.trim())}`);
  }


  return (
    <div className="page">
      <div className="container">
        <h1 className="title">{t("text.find_player")}</h1>
          <div className="search-wrapper">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch()
              }}
              placeholder={t("text.player_name")}
              className="input"
            />
            <button onClick={handleSearch}>{t("text.find")}</button>
          </div>
      </div>
    </div>
  );
}