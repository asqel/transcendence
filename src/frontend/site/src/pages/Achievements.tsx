
import { useState, useEffect } from "react";
import { userApi} from "../api";
import "./Achievements.css"

export const achievements = [
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
		name: "Sunny day",
		description: "win a game during the day",
	},
	{
		image: "/assets/coin/butterfly.png",
		name: "Fake win",
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
		name: "It's ok",
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
		name: "Fair play",
		description: "send GG in the chat after loosing",
	},
	{
		image: "/assets/coin/dots.png ",
		name: "You can rest now  ",
		description: "have all the achivements",
	},
]

function Achievements() {
	const [achievementList, setAchievementList] = useState<boolean[]>([])
	const [selectedSkin, setSelectedSkin] = useState(0)

	const [loadingSkin, setLoadingSkin] = useState<number | null>(null)

	async function handleSelectSkin(index: number) {
		if (!achievementList[index])
			return
		try {
			setLoadingSkin(index)
			await userApi.set_skin(index)
			setSelectedSkin(index)
		}
		catch (error) {
			console.error(error)
		}
		finally {
			setLoadingSkin(null)
		}
	}

	async function loadAchievements() {
		try {
			const list = await userApi.get_achivments();
			setAchievementList(list);
			const skin = await userApi.get_skin();
			setSelectedSkin(skin.skin);
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
				const selected = index === selectedSkin
			
				return (
					<button
						key={index}
						type="button"
						className={`achievement
							${selected ? "achievement-selected" : ""}
							${!unlocked ? "achievement-locked" : ""}

						`}
						onClick={() => handleSelectSkin(index)}
						disabled={!unlocked || loadingSkin !== null}
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
						
						{selected && (
							<span className="achievement-check">✓</span>
						)}
					</button>
				)
			})}
		</div>
	)
}

export default Achievements