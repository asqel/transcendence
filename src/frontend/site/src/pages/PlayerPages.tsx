// ProfilePage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { type UserResponse, globalApi } from "../api";
import { useTranslation } from 'react-i18next';



export default function ProfilePage() {
	const {t} = useTranslation()

	const { username } = useParams(); // récupère "toto" si l'URL est /profile/toto
	const [player, setPlayer] = useState<UserResponse | null>(null);
	const [error, setError] = useState<string|null>(null);

	async function fetch_player() {
		if (!username) return;
		try {
			const res: UserResponse = await globalApi.get_user(username);
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
		<div>{username}, join date: {player.join_date}</div> // affiche ce que tu veux ici
	) 
}