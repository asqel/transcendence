import { useState, useEffect, useRef } from "react"
import { useTranslation } from 'react-i18next';
import "./Friends.css"
import { useAuth } from "../context/AuthContext"


const OPC_AUTH = 0x01
const OPC_ADD_FRIENDS = 0x02
const OPC_LIST_REQUEST = 0x03
const OPC_REQUEST_RESPONSE = 0x04
const OPC_GET_FRIENDS_LIST = 0x05
const OPC_SELECT_FRIENDS = 0x06
const OPC_CHAT = 0x07
const OPC_REQUEST_CHAT = 0x9
const OPC_DELETE_FRIENDS = 0x08

function Friends() {
	const {t} = useTranslation()

	const { user } = useAuth()

	const [connected, setConnected] = useState<boolean>(false);
	const [wsError, setWsError] = useState<boolean>(false);
	const wsRef = useRef<WebSocket | null>(null);
	



	const [showAddFriendsPopup, setShowAddFriendsPopups] = useState<boolean>(false);
	const [addFriends, setAddFriends] = useState<string>("");
	const [addFriendsError, setAddFriendsError] = useState<string>("");
	const [loadingAddFriends, setLoadingAddFriends] = useState<boolean>(false);

	const [showFriendsRequestPopup, setShowFriendsRequestPopup] = useState<boolean>(false);
	const [friendsRequests, setFriendsRequests] = useState<string[]>([]);
	const [friendsRequestsError, setFriendsRequestsError] = useState<string>("");
	const [loadingFriendsRequest, setLoadingFriendsRequest] = useState<boolean>(false);

	const [friendsList, setFriendsList] = useState<string[]>([]);
	const [loadingFriendsList, setLoadingFriendsList] = useState<boolean>(false);
	const selectedFriend = useRef<string>("");

	const [chatMessages, setChatMessages] = useState<string[]>([]);
	const [chatInput, setChatInput] = useState("");
	const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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
				console.log("auth_error: ", bytes[1]);
				wsRef.current?.close();
			}           
		}
		else if (bytes[0] === OPC_ADD_FRIENDS) {
			if (bytes[1] === 0) {
				setLoadingAddFriends(false);
				setShowAddFriendsPopups(false);
			}
			else
				setAddFriendsError(t("req_error." + bytes[1]))

		}
		else if (bytes[0] === OPC_LIST_REQUEST) {
			if (bytes[1] === 0) {
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(2));
				if (str)
					setFriendsRequests(str.split("/"));
				else
					setFriendsRequests([]);
				setLoadingFriendsRequest(false);
			}
			else {
				setFriendsRequestsError("error");
				setLoadingFriendsRequest(false);
				console.log("requestList_error: ", bytes[1]);
			}
		}

		else if (bytes[0] === OPC_REQUEST_RESPONSE) {
			if (bytes[1] !== 0) {
				console.log("request_error: ", bytes[1]);
			}
		}

		else if (bytes[0] === OPC_GET_FRIENDS_LIST) {
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(2));
			if (str)
				setFriendsList(str.split("/"));
			else
				setFriendsList([]);
			setLoadingFriendsList(false);
		}
		else if (bytes[0] === OPC_SELECT_FRIENDS) {
			if (bytes[1] === 0) {
				setChatMessages([]);
				//messagesContainerRef.current = null;
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(2));
				selectedFriend.current = str;
				sender(OPC_REQUEST_CHAT);
			}
			if (bytes[1] !== 0)
				console.log("select_friend_error: ", bytes[1])
		}
		else if (bytes[0] === OPC_CHAT) {
			if (bytes[1] === 0) {
				console.log(bytes);
				let usr: string;
				if (bytes[2] === 0 && user) {
					usr = user.username;
				}
				if (bytes[2] === 1) {
					usr = selectedFriend.current;
				}
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(3));
				setChatMessages((prev) => [...prev, usr + ": " + str]);
			}
			else {
				console.log("chat_error: ",bytes[1]);
			}
		}
		else if (bytes[0] === OPC_DELETE_FRIENDS) {
			if (bytes[1] === 0) {
				setLoadingFriendsList(true);
				selectedFriend.current = "";
				sender(OPC_GET_FRIENDS_LIST);
			}
			else
				console.log("delete_error: ",bytes[1]);
		}
	}


	function sendAuth() {
		const token = localStorage.getItem("access");
		if (token) {
			sender(OPC_AUTH, token);
		}
		setLoadingFriendsList(true);
		sender(OPC_GET_FRIENDS_LIST);
	}


	function openPopup(type: string) {
		if (type === "add") {
			setAddFriends("");
			setAddFriendsError("");
			setShowAddFriendsPopups(true);
		}
		else if (type === "request"){
			setShowFriendsRequestPopup(true);
			sender(OPC_LIST_REQUEST);
			setLoadingFriendsRequest(true);
		}
	}

	// Ferme la popup
	function closePopup() {
		if (loadingAddFriends || loadingFriendsRequest)
			return;
		setShowAddFriendsPopups(false);
		setAddFriends("");
		setAddFriendsError("");

		setShowFriendsRequestPopup(false);
		setFriendsRequests([]);
		setFriendsRequestsError("");
	}

							
	function handleAddFriends() {
		setLoadingAddFriends(true);
		sender(OPC_ADD_FRIENDS, addFriends);
	}

	function handleFriendRequestResponse(val: number, name: string) {
		sender(OPC_REQUEST_RESPONSE, val + name);
		setLoadingFriendsRequest(true);
		sender(OPC_LIST_REQUEST);
		setLoadingFriendsList(true);
		sender(OPC_GET_FRIENDS_LIST);
	}

	function handleRequestAccepted () {
		setLoadingFriendsList(true);
		sender(OPC_GET_FRIENDS_LIST);
	}

	function handleDeleteFriend() {
		if (selectedFriend) {
			sender(OPC_DELETE_FRIENDS, selectedFriend.current);
		}
	}

	function handleSelectFriend(friend: string) {
		sender(OPC_SELECT_FRIENDS, friend);
	}

	function handleSendChat() {
		if (!chatInput.trim())
			return
		sender(OPC_CHAT, chatInput.trim())
		setChatInput("")
	}



	useEffect(() => {
		if (wsRef.current)
			return;
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

		window.addEventListener("friends:addedFriends", handleRequestAccepted);
		return () => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				wsRef.current.close();
			}
			wsRef.current = null;
			window.removeEventListener("friends:addedFriends", handleRequestAccepted);
		};
	}, [])


	useEffect(() => {
 		const el = messagesContainerRef.current
  		if (el)
			el.scrollTop = el.scrollHeight
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
		<div className="page-friend">
			<div className="friendslist">
				<div className="actions">
					<button onClick={() => openPopup("add")}>{t("friends-page.add_friend")}</button>
					<button onClick={() => openPopup("request")}>{t("friends-page.show_request")}</button>
					{selectedFriend.current && (
						<button className="delete" onClick={handleDeleteFriend}>delete</button>
					)}
				</div>
				<div className="list">
					{loadingFriendsList && (
						<p>{t("loading")}</p>
					)}
					{friendsList.length === 0 && (
						<p>{t("friends-page.no_friend")}</p>
					)}
					{friendsList.map((friend, i) => (
						<button key={i} onClick={() => (handleSelectFriend(friend))} disabled={friend == selectedFriend.current}>{friend}</button>
					))}
				</div>
			</div>
			<div className="friends-chatbox">
				<div className="chatbox-messages" ref={messagesContainerRef}>
					{chatMessages.length === 0 && (
						<p className="chatbox-empty">{t("chatbox.no_message")}</p>
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
						placeholder={t("chatbox.write_message")}
						className="input"
					/>
					<button onClick={handleSendChat}>
						{t("chatbox.send")}
					</button>
				</div>
			</div>
			{(showAddFriendsPopup || showFriendsRequestPopup) && (
				<div className="popups-overlay" onClick={() => closePopup()}>
					<div className="popups" onClick={(e) => e.stopPropagation()}>
						{showAddFriendsPopup && (
							<>
							<h2>{t("friends-page.add_friend")}</h2>
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

							<div className="popups-actions">
								<button className="popups-cancel-button" onClick={() => closePopup()} disabled={loadingAddFriends}>
									{t("friends-page.cancel")}
								</button>
								<button className="popups-confirm-button" onClick={handleAddFriends} disabled={loadingAddFriends}>
									{loadingAddFriends ? ("...") : (t("friends-page.send_request"))}
								</button>
							</div>
							</>
						)}
						{showFriendsRequestPopup && (
							<>
							<h2>{t("friends-page.pending_request")}</h2>
							{loadingFriendsRequest && (
								<p>{t("loading")}</p>
							)}
							{friendsRequestsError && (
								<p>{t("error.default")}</p>
							)}
							{friendsRequests.length === 0 && (
								<p>{t("friends-page.no_request")}</p>
							)}
							{friendsRequests.map((name, i) => (
								<div key={i}>
									<p>{name}</p>
									<button onClick={() => handleFriendRequestResponse(1, name)}>V</button>
									<button onClick={() => handleFriendRequestResponse(0, name)}>X</button>
								</div>
							))}
							<div className="popups-actions">
								<button className="popups-cancel-button" onClick={() => closePopup()} disabled={loadingAddFriends}>
									{t("friends-page.cancel")}
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
