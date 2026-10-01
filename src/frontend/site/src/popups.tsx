import { useState, useRef, useEffect } from "react"
import { useAuth } from "./context/AuthContext"
import { useTranslation } from 'react-i18next';
import "./popups.css"


const OPC_ACHIVEMENTS_NOTIF = 0x00;
const OPC_FRIEND_REQUEST_NOTIF = 0x01;
const OPC_CHAT_NOTIF = 0x02;
const OPC_FRIEND_REQUEST_ACCEPTED_NOTIF = 0x03;

function Popups() {
	const { t } = useTranslation();
	const { user } = useAuth();

	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const shouldReconnectRef = useRef(true);

	const [achievementPopup, setAchievementPopup] = useState<number | null>(null);
	const [friendRequestPopup, setFriendRequestPopup] = useState<string | null>(null);
	const [acceptedFriendPopup, setAcceptedFriendPopup] = useState<string | null>(null);
	const [messagePopup, setMessagePopup] = useState<string | null>(null);
	

	

	function showAchievement(id: number, val: string|number) {
		if (id === OPC_ACHIVEMENTS_NOTIF && typeof val === "number")
			setAchievementPopup(val);
		else if (id === OPC_FRIEND_REQUEST_NOTIF && typeof val === "string")
			setFriendRequestPopup(val);
		else if (id === OPC_FRIEND_REQUEST_ACCEPTED_NOTIF && typeof val === "string")
			setAcceptedFriendPopup(val);
		else if (id === OPC_CHAT_NOTIF && typeof val === "string")
			setMessagePopup(val);
		setTimeout(() => {
			setAchievementPopup(null);
			setFriendRequestPopup(null);
			setAcceptedFriendPopup(null);
			setMessagePopup(null);
		}, 4000)
	}

	function handleMessage(event: MessageEvent<any>) {
		const bytes = new Uint8Array(event.data)
		if (bytes[0] === OPC_ACHIVEMENTS_NOTIF){
			showAchievement(OPC_ACHIVEMENTS_NOTIF, bytes[1]);
			window.dispatchEvent(new Event("achievements:new"));
		}
		else if (bytes[0] === OPC_FRIEND_REQUEST_NOTIF) {
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(1));
			showAchievement(OPC_FRIEND_REQUEST_NOTIF, str);
			window.dispatchEvent(new Event("friends:addedFriends"));
		}
		else if (bytes[0] === OPC_CHAT_NOTIF) {
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(1));
			showAchievement(OPC_CHAT_NOTIF, str);
		}
		else if (bytes[0] === OPC_FRIEND_REQUEST_ACCEPTED_NOTIF) {
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(1));
			showAchievement(OPC_FRIEND_REQUEST_ACCEPTED_NOTIF, str);
			window.dispatchEvent(new Event("friends:addedFriends"));
		}
	}

	function sendAuth() {
		const token: string | null = localStorage.getItem("access")
		if (token && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			try {
				wsRef.current.send(token);
			} catch (error) {
				console.error("Erreur d'envoi du token:", error);
			}
		}
	}

	function connect(deadline: number) {
		if (wsRef.current) {
			return;
		}

		const ws = new WebSocket(`wss://${window.location.host}/ws/notif/`)
		ws.binaryType = "arraybuffer"

		ws.onopen = () => {
			sendAuth()
		}
		ws.onclose = () => {

			wsRef.current = null
			if (shouldReconnectRef.current && Date.now() < deadline) {
				reconnectTimeoutRef.current = setTimeout(() => connect(deadline), 3000)
			}
		}
		ws.onerror = (error) => {
			console.log("Erreur WebSocket notif:", error);
			wsRef.current = null
		}
		ws.onmessage = handleMessage
		wsRef.current = ws
	}

	useEffect(() => {
		if (!user) {
			shouldReconnectRef.current = false
			if (wsRef.current) {
				wsRef.current.close()
			}
			wsRef.current = null
			return
		}

		shouldReconnectRef.current = true
		connect(Date.now() + 30000)

		return () => {
			shouldReconnectRef.current = false
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current)
			}
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)  {
				wsRef.current.close()
			}
			wsRef.current = null
		}
	}, [user])

	return (
		<>
			{achievementPopup && (
				<div className="popup">
					<div className="popup-title">
						{t("popups.achievement")}
					</div>
					<div className="popup-text">
						{t("popups.achievement_text")} {t("achievements." + achievementPopup + ".name")}
					</div>
				</div>
			)}
			{friendRequestPopup && (
				<div className="popup">
					<div className="popup-title">
						{t("popups.friend_recive")}
					</div>
					<div className="popup-text">
						{friendRequestPopup} {t("popups.friend_recive_text")}
					</div>
				</div>
			)}
			{acceptedFriendPopup && (
				<div className="popup">
					<div className="popup-title">
						{t("popups.friend_accepted")}
					</div>
					<div className="popup-text">
						{friendRequestPopup} {t("popups.friend_accepted_text")}
					</div>
				</div>
			)}
			 {messagePopup && (
				<div className="popup">
					<div className="popup-title">
						{t("popups.message")}
					</div>
					<div className="popup-text">
						{messagePopup} {t("popups.message_text")}
					</div>
				</div>
			)}
		</>
	);
}

export default Popups