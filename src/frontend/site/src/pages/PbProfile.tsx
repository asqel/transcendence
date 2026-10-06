// ProfilePage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { type UserResponse, globalApi } from "../api";
import { useTranslation } from 'react-i18next';
import "./PbProfile.css"
import countries from "../data/countries.json";


export default function ProfilePage() {
	const {t} = useTranslation()

	const { username } = useParams();
	const [player, setPlayer] = useState<UserResponse | null>(null);
	const [date, setDate] = useState<string>("");

	const [error, setError] = useState<string|null>(null);

	async function fetch_player() {
		if (!username) return;
		try {
			const res: UserResponse = await globalApi.get_user(username);
			const date = new Date(res.join_date);
			setDate(date.toLocaleString(undefined, {day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"}))
			setPlayer(res);
		}
		catch {
			setError("error")
		}
	}
	useEffect(() => {fetch_player()}, [username]);


	if (error)
		return <p>{t("error.server")}</p>;
	if (!player) 
		return <p>{t("loading")}</p>;
	return (
		<div className="pb-profile-page">
			<h1>{t("pb-profile-page.title").replace("%username", username || "")}</h1>
			<div className="profile-info">
				<div className="name">
					<strong>{t("pb-profile-page.name")}: </strong> {username}
				</div>
				<div className="bio">
					<strong>{t("pb-profile-page.bio")}: </strong>
					<br />
					<textarea
						className="bio-textarea"
						value={player.bio}
						disabled={true}
					/>
				</div>
				<div className="country">
					<strong>{t("pb-profile-page.country")}: </strong>{player.country} {countries.find(country => country.code === player.country)?.flag}
				</div>
				<div className="join-date">
					<strong>{t("pb-profile-page.join-date")}: </strong> {date}
				</div>

			</div>
			<div className="games-info">
				<div className="elo">
					<strong>{t("pb-profile-page.elo")}: </strong> {player.elo}
				</div>
				<div className="streak">
					<strong>{t("pb-profile-page.streak")}: </strong> {player.streak}
				</div>
				<div className="win-count">
					<strong>{t("pb-profile-page.win-count")}: </strong> {player.win_count}
				</div>
				<div className="loss-count">
					<strong>{t("pb-profile-page.loss-count")}: </strong> {player.loss_count}
				</div>
				<div className="placed">
					<strong>{t("pb-profile-page.placed")}: </strong> {player.placed}
				</div>
			</div>
		</div>
	) 
}
