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
			const date = new Date("2026-09-22T18:35:25.478761+00:00");
			setDate(date.toLocaleString("fr-FR", {day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"}))
			setPlayer(res);
		}
		catch {
			setError("error")
		}
	}
	useEffect(() => {fetch_player()}, [username]);


	if (error) return <p>ERROR</p>;
	if (!player) return <p>{t("text.loading")}</p>;
	return (
		<div className="pb-profile-page">
			<section className="profile-section">
				<p><strong>Pseudo :</strong> {username}</p>
				<p><strong>Bio :</strong></p>
				<p>{player.bio}</p>
				<p><strong>Country: </strong>{player.country} {countries.find(country => country.code === player.country)?.flag}</p>
				<p><strong>join_date: </strong>{date}</p>
				<p><strong>streak: </strong>{player.streak}</p>
				<p><strong>win count: </strong>{player.win_count}</p>
				<p><strong>loss count: </strong> {player.loss_count}</p>
				<p><strong>placed: </strong> {player.placed}</p>
			</section>
		</div>
	) 
}