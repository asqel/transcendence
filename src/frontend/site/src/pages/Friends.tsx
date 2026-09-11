import { useState, useEffect, useRef } from "react"
import "./Friends.css"


const OPC_AUTH = 0x01
const OPC_ADD = 0x02
const OPC_CHAT = 0x03

function Friends() {
	const [connected, setConnected] = useState<boolean>(false);
	const [wsError, setWsError] = useState<boolean>(false);
	const wsRef = useRef<WebSocket | null>(null)
	
	const [chatMessages, setChatMessages] = useState<string[]>([])
	const [chatInput, setChatInput] = useState("")
	const messagesContainerRef = useRef<HTMLDivElement | null>(null)

	const [showAddFriendsPopup, setShowAddFriendsPopups] = useState<boolean>(false)
	const [addFriends, setAddFriends] = useState<string>("")
	const [addFriendsError, setAddFriendsError] = useState<string>("")
	const [loadingAddFriends, setLoadingAddFriends] = useState<boolean>(false)

	function sender(nb: number, val: string | number | null = null) {
		const bytes: Array<number> = [];
		bytes.push(nb);
		if (typeof val === "string") {
			const encoder = new TextEncoder();
			const valBytes = encoder.encode(val);
			for (const i of valBytes) {
				bytes.push(i);
			}
		}
		else if (typeof val === "number") {
			bytes.push(val & 0xff);
			bytes.push((val >> 8) & 0xff)
		}
		if (bytes && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			try {
				wsRef.current?.send(new Uint8Array(bytes));
			}
			catch {
				console.log("sender error");
			}
		}
	}

	function handleMessage(event: MessageEvent<any>) {
		const bytes = new Uint8Array(event.data)
		if (bytes[0] === OPC_AUTH) {
			if (bytes[1] !== 0) {
				console.log("error auth: ", bytes[1]);
				wsRef.current?.close();
			}           
		}
		else if (bytes[0] === OPC_ADD) {
			if (bytes[1] !== 0) {
				setAddFriendsError("Not found")
			}
			setLoadingAddFriends(false);   
		}
		else if (bytes[0] === OPC_CHAT) {
			if (bytes[1] === 0) {
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(2));
				setChatMessages((prev) => [...prev, str]);
			}           
		}
	}

	function handleSendChat() {
		if (!chatInput.trim())
			return
		sender(OPC_CHAT, chatInput.trim())
		setChatInput("")
	}

	function sendAuth() {
		const token = localStorage.getItem("access");
		if (token) {
			sender(OPC_AUTH, token);
		}
	}


	function openAddPopup() {
		setAddFriends("")
		setAddFriendsError("")
		setShowAddFriendsPopups(true)
	}

	// Ferme la popup
	function closeAddPopup() {
		if (loadingAddFriends)
			return;

		setShowAddFriendsPopups(false);
		setAddFriends("");
		setAddFriendsError("");
	}

	function handleAddFriends() {
		setLoadingAddFriends(true);
		sender(OPC_ADD, addFriends);
	}

	useEffect(() => {
		if (wsRef.current) {
			return;
		}

		const ws = new WebSocket(`wss://${window.location.host}/ws/friend-chat/`);
		ws.binaryType = "arraybuffer";

		ws.onopen = () => {
			setConnected(true);
			setWsError(false);
			sendAuth();
		};

		ws.onclose = () => {
			setConnected(false);
			wsRef.current = null;
		};

		ws.onerror = (error) => {
			setWsError(true);
			console.error('WebSocket error:', error);
			wsRef.current = null;
		};
		
		ws.onmessage = handleMessage;
		wsRef.current = ws;
		
		return () => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				wsRef.current.close();
			}
			wsRef.current = null;
		};
	}, [])

	// Vérifie que le composant est toujours monté avant de mettre à jour l'état
	useEffect(() => {
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
	}, [chatMessages])

	if ((wsError || !connected)) {
		return (
			<div>
				<p className="ws-error">
					Impossible de se connecter au serveur. Réessaie plus tard.
				</p>
			</div>
		)
	}

	return (
		<div className="page">
			<div className="friendslist">
				<button onClick={openAddPopup}>add friends</button>
				Ta pas d'amis encore
			</div>
			<div className="chatbox">
				<div className="chatbox-messages" ref={messagesContainerRef}>
					{chatMessages.length === 0 && (
						<p className="chatbox-empty">Aucun message pour l'instant.</p>
					)}
					{chatMessages.map((msg, i) => (
						<p key={i} className="chatbox-message">{msg}</p>
					))}
				</div>
				<div className="chatbox-input-row">
					<input
						type="text"
						value={chatInput}
						onChange={(e) => setChatInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSendChat()
						}}
						placeholder="Écrire un message..."
						className="input"
					/>
					<button onClick={handleSendChat}>
						Envoyer
					</button>
				</div>
			</div>
			{showAddFriendsPopup && (
				<div className="add-friends-overlay" onClick={closeAddPopup}>
					<div className="add-friends" onClick={(e) => e.stopPropagation()}>
						<h2>Add friends</h2>
						<input
							type="text"
							className="add-friends-input"
							placeholder="Friends Name"
							value={addFriends}
							onChange={(e) => {
								setAddFriends(e.target.value)
								setAddFriendsError("")
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									handleAddFriends()
								}
							}}
							autoFocus
							disabled={loadingAddFriends}
						/>
						{addFriendsError && (
							<p className="add-friends-error">
								{addFriendsError}
							</p>
						)}
						<div className="add-friends-actions">
							<button
								className="add-cancel-button"
								onClick={closeAddPopup}
								disabled={loadingAddFriends}
							>
								Annuler
							</button>
							<button
								className="add-confirm-button"
								onClick={handleAddFriends}
								disabled={loadingAddFriends}
							>
								{loadingAddFriends ?
									("Adding...")
									:
									("Add friends")
								}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Friends
