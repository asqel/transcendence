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


	if (error) return <p>ERROR</p>;
	if (!player) return <p>{t("text.loading")}</p>;
	return (
		<div className="pb-profile-page">
			<section className="profile">
				<div className="name">
					<strong>Pseudo :</strong> {username}
				</div>
				<div className="bio">
					<strong>Bio :</strong>
					<br />
					<textarea
						className="bio-textarea"
						value={player.bio}
						disabled={true}
					/>
				</div>
				<div className="country">
					<strong>Country: </strong>{player.country} {countries.find(country => country.code === player.country)?.flag}
				</div>
				<div className="join-date">
					<strong>Join-date: </strong> {date}
				</div>
				<div className="elo">
					<strong>Elo: </strong> {player.elo}
				</div>
				<div className="streak">
					<strong>Streak: </strong> {player.streak}
				</div>
				<div className="win-count">
					<strong>Win count: </strong> {player.win_count}
				</div>
				<div className="loss-count">
					<strong>Loss count: </strong> {player.loss_count}
				</div>
				<div className="placed">
					<strong>Placed: </strong> {player.placed}
				</div>
			</section>
		</div>
	) 
}
