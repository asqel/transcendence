import { useState, useEffect, useRef } from "react"
import "./Friends.css"


const OPC_AUTH = 0x01
const OPC_ADD = 0x02
const OPC_REQUEST = 0x03
const OPC_REQUEST_RESPONSE = 0x04
const OPC_FRIENDS = 0x05
const OPC_FRIENDS_CHAT = 0x06
const OPC_CHAT = 0x07

function Friends() {
	const [connected, setConnected] = useState<boolean>(false);
	const [wsError, setWsError] = useState<boolean>(false);
	const wsRef = useRef<WebSocket | null>(null);
	
	const [chatMessages, setChatMessages] = useState<string[]>([]);
	const [chatInput, setChatInput] = useState("");
	const messagesContainerRef = useRef<HTMLDivElement | null>(null);

	const [friendsList, setFriendsList] = useState<string[]>([]);
	const [loadingFriendsList, setLoadingFriendsList] = useState<boolean>(false);

	const [addFriendsPopup, setAddFriendsPopups] = useState<boolean>(false);
	const [addFriends, setAddFriends] = useState<string>("");
	const [addFriendsError, setAddFriendsError] = useState<string>("");
	const [loadingAddFriends, setLoadingAddFriends] = useState<boolean>(false);

	const [showRequestPopup, setShowRequestPopup] = useState<boolean>(false);
	const [requests, setRequests] = useState<string[]>([]);
	const [requestsError, setRequestsError] = useState<string>("");
	const [loadingRequest, setLoadingRequest] = useState<boolean>(false);

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
			if (bytes[1] === 1) {
				setAddFriendsError("Error");
			}
			else if (bytes[1] === 2) {
				setAddFriendsError("Not found");
			}
			else if (bytes[1] === 3) {
				setAddFriendsError("Already send");
			}
			else if (bytes[1] === 4) {
				setAddFriendsError("Already friends");
			}
			setLoadingAddFriends(false);
			setShowRequestPopup(false);
		}
		else if (bytes[0] === OPC_REQUEST) {
			if (bytes[1] === 0) {
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(2));
				if (str)
					setRequests(str.split("/"));
				setLoadingRequest(false);
			}
			else {
				setRequestsError("error");
				setLoadingRequest(false);
			}
		}
		else if (bytes[0] === OPC_REQUEST_RESPONSE) {
			if (bytes[1] !== 0) {
				console.log("request error: ", bytes[1]);
			}
		}
		else if (bytes[0] === OPC_FRIENDS) {
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(2));
				if (str)
					setFriendsList(str.split("/"));
				setLoadingFriendsList(false);
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
		setLoadingFriendsList(true);
		sender(OPC_FRIENDS);
	}


	function openPopup(type: string) {
		if (type === "add") {
			setAddFriends("");
			setAddFriendsError("");
			setAddFriendsPopups(true);
		}
		else if (type === "request"){
			setShowRequestPopup(true);
			sender(OPC_REQUEST);
			setLoadingRequest(true);
		}
	}

	// Ferme la popup
	function closePopup() {
		if (loadingAddFriends || loadingRequest)
			return;
		setAddFriendsPopups(false);
		setAddFriends("");
		setAddFriendsError("");

		setShowRequestPopup(false);
		setRequests([]);
		setRequestsError("");
	}

							
	function handleAddFriends() {
		setLoadingAddFriends(true);
		sender(OPC_ADD, addFriends);
	}

	function handleRequestFriends(val: number, name: string) {
		sender(OPC_REQUEST_RESPONSE, val + name);
		setLoadingRequest(true);
		sender(OPC_REQUEST);
		sender(OPC_FRIENDS);
	}

	function handleChatFriend(friend: string) {
		sender(OPC_FRIENDS_CHAT, friend)
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
			console.log('WebSocket error:', error);
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
				<button onClick={() => openPopup("add")}>add friends</button>
				<button onClick={() => openPopup("request")}>Show request</button>
				{loadingFriendsList && (
					<p>Loading...</p>
				)}
				{friendsList.length === 0 && (
					<p>Aucun amis pour le moment</p>
				)}
				{friendsList.map((friend, i) => (
					<button key={i} onClick={() => (handleChatFriend(friend))}>{friend}</button>
				))}
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
			{(addFriendsPopup || showRequestPopup) && (
				<div className="popups-overlay" onClick={() => closePopup()}>
					<div className="popups" onClick={(e) => e.stopPropagation()}>
						{addFriendsPopup && (
							<>
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
								<p className="popups-error">
									{addFriendsError}
								</p>
							)}
							
							<div className="add-friends-actions">
								<button
									className="add-cancel-button"
									onClick={() => closePopup()}
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
							</>
						)}
						{showRequestPopup && (
							<>
							<h2>Pending Friends Requests</h2>
							{loadingRequest && (
								<p>Loading</p>
							)}
							{requestsError && (
								<p>Error</p>
							)}
							{requests.length === 0 && (
								<p>No friend request</p>
							)}
							{requests.map((name, i) => (
								<div key={i}>
									<p>{name}</p>
									<button onClick={() => handleRequestFriends(1, name)}>V</button>
									<button onClick={() => handleRequestFriends(0, name)}>X</button>
								</div>
							))}
							<div className="add-friends-actions">
								<button
									className="add-cancel-button"
									onClick={() => closePopup()}
									disabled={loadingAddFriends}
								>
									Annuler
								</button>
							</div>
							</>
						)}

					</div>
				</div>
			)}
		</div>
	)
}

export default Friends
