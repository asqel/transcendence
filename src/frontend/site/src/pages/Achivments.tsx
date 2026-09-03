
import { useState, useEffect } from "react";
import { userApi} from "../api";
import "./Achivments.css"

const achievements = [
	{
		image: "/assets/coin/coin.png",
		name: "The begining",
		description: "creer un compte",
	},
	{
		image: "/assets/coin/arrow-up.png",
		name: "UP",
		description: "win verticaly",
	},
	{
		image: "/assets/coin/creature.png",
		name: "Secrets!",
		description: "find a secret",
	},
	{
		image: "/assets/coin/equal.png",
		name: "Equals...",
		description: "finish a game by a tie",
	},
	{
		image: "/assets/coin/infinity.png",
		name: "My Love",
		description: "rematch at least five times in the game",
	},
	{
		image: "/assets/coin/sun.png",
		name: "",
		description: "win a game during the day",
	},
	{
		image: "/assets/coin/butterfly.png",
		name: "Surpassed",
		description: "win a game to a forfeit",
	},
	{
		image: "/assets/coin/crown.png",
		name: "Unbeatable",
		description: "have a 5 win streak",
	},
	{
		image: "/assets/coin/exclamation.png",
		name: "Ear me",
		description: "send a message in the non spectator chat",
	},
	{
		image: "/assets/coin/moon.png",
		name: "No sleep",
		description: "win a game at night",
	},
	{
		image: "/assets/coin/poop.png",
		name: "Looser",
		description: "have 5 loose streak",
	},
	{
		image: "/assets/coin/fountain.png",
		name: "Unknow wolrd",
		description: "come from an unknown world",
	},
	{
		image: "/assets/coin/colon-three.png ",
		name: "Cutie",
		description: "send a :3 in the non spectator chat",
	},
	{
		image: "/assets/coin/cloud.png ",
		name: "Fair",
		description: "send GG in the chat after loosing",
	},
	{
		image: "/assets/coin/dots.png ",
		name: "Unbeatable",
		description: "have all the achivements",
	},
]

function Achivments() {
	const [achievementList, setAchievementList] = useState<Array<boolean>>([])

	async function loadAchievements() {
			try {
				const data = await userApi.get_achivments()
				setAchievementList(data)
			}
			catch (error) {
				console.error(error)
			}
		}

	useEffect(() => {loadAchievements()}, [])

	return (
		<div className="achievements">
			{achievements.map((achievement, index) => {
			const unlocked = achievementList[index]

		return (
			<div
				key={index}
				className={`achievement ${unlocked ? "" : "achievement-locked"}`}
			>
				<img
					src={achievement.image}
					alt={achievement.name}
					className="achievement-image"
				/>

				<div className="achievement-info">
					<h3>{achievement.name}</h3>
					<p>{achievement.description}</p>
				</div>
			</div>
		)
	})}
</div>
	)
}

export default Achivments