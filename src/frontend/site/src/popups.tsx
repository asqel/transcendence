import { useState, useRef, useEffect } from "react"
import { useAuth } from "./context/AuthContext"
import "./popups.css"


const OPC_ACHIVEMENTS_NOTIF = 0x00;
const OPC_FRIEND_REQUEST_NOTIF = 0x01;
const OPC_CHAT_NOTIF = 0x02;
const OPC_FRIEND_REQUEST_ACCEPT = 0x03;

function Popups() {
	const { user } = useAuth()

	const wsRef = useRef<WebSocket | null>(null)
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const shouldReconnectRef = useRef(true)

	const [achievementPopup, setAchievementPopup] = useState<string | null>(null)
	const [newFriendPopup, setNewFriendPopup] = useState<string | null>(null)
	const [messagePopup, setMessagePopup] = useState<string | null>(null)
	

	

	function showAchievement(id: number, str: string) {
		if (id === OPC_ACHIVEMENTS_NOTIF)
			setAchievementPopup(str);
		else if (id === OPC_FRIEND_REQUEST_NOTIF)
			setNewFriendPopup(str);
		else if (id === OPC_CHAT_NOTIF)
			setMessagePopup(str);
		setTimeout(() => {
			setAchievementPopup(null);
			setNewFriendPopup(null);
			setMessagePopup(null);
		}, 4000)
	}

	function handleMessage(event: MessageEvent<any>) {
		const bytes = new Uint8Array(event.data)
		if (bytes[0] === OPC_ACHIVEMENTS_NOTIF){
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(1));
			showAchievement(OPC_ACHIVEMENTS_NOTIF, str);
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
			showAchievement(OPC_CHAT_NOTIF, str);2
		}
		else if (bytes[0] === OPC_FRIEND_REQUEST_ACCEPT) {
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
			// Ne pas tenter de se reconnecter immédiatement pour éviter les boucles
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
		<div>
			{achievementPopup && (
				<div className="popup">
					<div className="popup-title">
						🏆 Achievement débloqué !
					</div>
					<div className="popup-text">
						{achievementPopup}
					</div>
				</div>
			)}
			 {newFriendPopup && (
				<div className="popup">
					<div className="popup-title">
						Demande d'amis accepter
					</div>
					<div className="popup-text">
						{newFriendPopup} a accepter ta demande
					</div>
				</div>
			)}
			 {messagePopup && (
				<div className="popup">
					<div className="popup-title">
						Nouveau message
					</div>
					<div className="popup-text">
						{messagePopup} ta envoyer un message
					</div>
				</div>
			)}
		</div>
	);
}

export default Popups