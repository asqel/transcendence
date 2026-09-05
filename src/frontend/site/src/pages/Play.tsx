import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next';
import { achievements } from "./Achievements";
import "./Play.css"

const OPC_AUTH = 0xff

const OPC_CREATE = 0xf0
const OPC_JOIN = 0xf1
const OPC_JOINED = 0xf2
const OPC_LEAVE = 0xf3
const OPC_SEND = 0xfa
const OPC_TEXT = 0xfb

const OPC_PLACE = 0x10
const OPC_PLACED = 0x11
const OPC_PLACED_SPEC = 0x15
const OPC_WIN = 0x12
const OPC_WIN_SPEC = 0x14
const OPC_REMATCH = 0x13

const OPC_ACHI = 0xe0

function Play() {
	const {t} = useTranslation()
	//const navigate = useNavigate()
	const { user } = useAuth()

	const wsRef = useRef<WebSocket | null>(null)
	const [wsError, setWsError] = useState(false)

	const [connected, setConnected] = useState(false)
	//const [autentified, setAutentified] = useState(false)
	const autentified = useRef(false);
	const [partId, setpartId] = useState<string | null>(null)

	const { partId: urlPartId } = useParams()

	const [codeInput, setCodeInput] = useState(urlPartId ?? "")

	const [chatMessages, setChatMessages] = useState<string[]>([])
	const [chatInput, setChatInput] = useState("")
	
	const messagesContainerRef = useRef<HTMLDivElement | null>(null)

	const [board, setBoard] = useState<number[]>(Array(42).fill(0))

	const self = useRef<1|2>(1);
	const opponent = useRef<1|2>(2);
	const selfSkin = useRef<number>(0);
	const opponentSkin = useRef<number>(0);
	const [opLeft, setOpLeft] = useState<boolean>(false);
	const [winer, setWiner] = useState<string>(user?.username ?? "");
	const [currentPlayer, setCurrentPlayer] = useState<1|2>(1);
	const currentPlayerRef = useRef<1|2>(1);
	const startPlayerRef = useRef<1|2>(1);
	const [gameState, setGameState] = useState<"won" | "lose" | "draw" | null>(null);
	const [rematchSelf, setRemathSelf] = useState<0|1>(0);
	const [rematchOp, setRemathOp] = useState<0|1>(0);
	const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [opAkf, setOpAkf] = useState<boolean>(false);
	const [achievementPopup, setAchievementPopup] = useState<string | null>(null);

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
		wsRef.current?.send(new Uint8Array(bytes));
	}

	function handleMessage(event: MessageEvent<any>) {
		const bytes = new Uint8Array(event.data)
		if (bytes[0] === OPC_AUTH) {
			if (bytes[1] === 0)
				autentified.current = true;
			else
				console.log(bytes[1]);
		}
		else if (bytes[0] === OPC_CREATE) {
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(1));
			setpartId(str);
		}
		else if (bytes[0] === OPC_JOIN) {
			console.log(bytes);
			if (bytes[1] === 0) {
				selfSkin.current = bytes[2];
				console.log("selfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", bytes[2])
			}
			else
				setpartId(null);
		}
		else if (bytes[0] === OPC_JOINED) {
			const decoder = new TextDecoder();
			opponentSkin.current = bytes[1];
			const str = decoder.decode(bytes.subarray(2));
			setChatMessages((prev) => [...prev, str + t("joining_string")]);
		}
		else if (bytes[0] === OPC_REMATCH) {
			setRemathOp(1);
			if (!autentified.current) {
				setRemathSelf(1);
			}
		}
		else if (bytes[0] === OPC_LEAVE) {
			setOpLeft(true);
		}
		else if (bytes[0] === OPC_TEXT) {
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(1));
			setChatMessages((prev) => [...prev, str]);
		}
		else if (bytes[0] === OPC_PLACE) {
			console.log("error:" + bytes[1]);
		}
		else if (bytes[0] === OPC_PLACED) {
			const column = bytes[1] | (bytes[2] << 8)

			const player = currentPlayerRef.current
			playColumn(column, player)
			if (player === self.current)
				changePlayer(opponent.current)
			else if (player === opponent.current)
				changePlayer(self.current)
		}
		else if (bytes[0] === OPC_PLACED_SPEC) {
			const column = bytes[1] | (bytes[2] << 8)

			const player = bytes[3] as (1|2);
			playColumn(column, player)
			console.log("euuuuu")
		}
		else if (bytes[0] === OPC_WIN) {
			if (bytes[1] === self.current)
				setGameState("won")
			else if (bytes[1] === opponent.current)
				setGameState("lose")
			else if (bytes[1] === 3)
				setGameState("draw")
		}
		else if (bytes[0] === OPC_WIN_SPEC) {
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(1));
			setWiner(str);
			setGameState("won");
		}
		else if (bytes[0] === OPC_ACHI) {
			showAchievement(achievements[bytes[1]].name);
			console.log(achievements[bytes[1]].name)
		}
	}

	function handleCreateGame() {
		sender(OPC_AUTH, localStorage.getItem("access"));
		sender(OPC_CREATE, 0);
		self.current = 1;
		opponent.current = 2
	}
	function handleJoin() {
		if (!codeInput.trim())
			return
		sender(OPC_AUTH, localStorage.getItem("access"));
		sender(OPC_JOIN, codeInput.trim())
		setpartId(codeInput.trim());
		self.current = 2;
		opponent.current = 1
	}

	function handleSpectate() {
		if (!codeInput.trim())
			return
		sender(OPC_JOIN, codeInput.trim());
		setpartId(codeInput.trim());
	}

	function handleRematch() {
		setRemathSelf(1);
		sender(0x13);
	}

	function handleQuit() {
		window.location.href = "/play";
	}

	function handleSendChat() {
		if (!chatInput.trim())
			return
		sender(OPC_SEND, chatInput.trim())
		setChatInput("")
	}

	function changePlayer(player: 1 | 2) {
		currentPlayerRef.current = player
		setCurrentPlayer(player)
		if (player === opponent.current)
			startTurnTimer()
		else
			stopTurnTimer()
	}

	function handleColumnClick(column: number) {
		sender(OPC_PLACE, column)
	}

	function playColumn(column: number, player: 1 | 2) {
		setBoard((prevBoard) => {
			const newBoard = [...prevBoard]

			// On part de la ligne du bas
			for (let row = 5; row >= 0; row--) {
				const index = row * 7 + column

				if (newBoard[index] === 0) {
					newBoard[index] = player
					break
				}
			}

			return newBoard
		})
	}

	function getCoinImage(player: 1 | 2): string {
		let skin: number;
		if (player === self.current)
			skin = selfSkin.current
		else
			skin = opponentSkin.current;

		return achievements[skin].image
	}

	
	function startTurnTimer() {
		if (turnTimerRef.current !== null) {
			clearTimeout(turnTimerRef.current)
		}

		turnTimerRef.current = setTimeout(() => {
			setOpAkf(true);
		}, 20 * 1000)
	}

	function stopTurnTimer() {
		if (turnTimerRef.current !== null) {
			clearTimeout(turnTimerRef.current)
			turnTimerRef.current = null
		}
	}

	function showAchievement(name: string) {
	setAchievementPopup(name)

	setTimeout(() => {
		setAchievementPopup(null)
	}, 4000)
}

	useEffect(() => {
		const ws = new WebSocket(`wss://${window.location.host}/ws/api/`);
		ws.binaryType = "arraybuffer";
		ws.onopen = () => setConnected(true);
		ws.onclose = () => setConnected(false);
		ws.onerror = () => setWsError(true);
		ws.onmessage = handleMessage
		wsRef.current = ws;
		return () => {
			ws.close()
			wsRef.current = null
		}
	}, [])	

	useEffect(() => {
		if (partId)
			window.history.replaceState({}, "", `/play/${partId}`);
	}, [partId])

	useEffect(() => {
 		const el = messagesContainerRef.current
  		if (el)
			el.scrollTop = el.scrollHeight
	}, [chatMessages])

	useEffect(() => {
		if (rematchSelf === 1 && rematchOp === 1) {
			setGameState(null)

			startPlayerRef.current =
				startPlayerRef.current === 1 ? 2 : 1

			changePlayer(startPlayerRef.current)

			setBoard(Array(42).fill(0))

			setRemathSelf(0)
			setRemathOp(0)
		}
	}, [rematchSelf, rematchOp])

	if (wsError || !connected) {
		return (
			<div className="page">
				<p className="ws-error">
					Impossible de se connecter au serveur. Réessaie plus tard.
				</p>
			</div>
		)
	}

	if (partId && !autentified.current && 0) {
		return (
			<div className="page">
				<p className="ws-error">
					Impossible de s'autentifier
				</p>
			</div>
		)
	}

	return (
		<div className="page">
			{achievementPopup && (
				<div className="achievement-popup">
					<div className="achievement-popup-title">
						🏆 Achievement débloqué !
					</div>

					<div className="achievement-popup-name">
						{achievementPopup}
					</div>
				</div>
			)}
			{!partId && (
				<>
				<h1>Play</h1>

				<div className="content">
					<div className="join-section">
						<input
							type="text"
							value={codeInput}
							onChange={(e) => setCodeInput(e.target.value)}
							placeholder="Code de la partie"
							className="input"
						/>
						<button onClick={handleSpectate} disabled={!connected}>
							Spectate
						</button>
						{user && (
							<button onClick={handleJoin} disabled={!connected}>
								Join
							</button>
						)}
					</div>

					{user && (
						<button onClick={handleCreateGame} disabled={!connected}>
							Créer une partie
						</button>
					)}
				</div>
				</>
			)}



			{partId && (
				<div className="game-layout">
					<h1>{partId}</h1>
					<div className="puissance4">
						{gameState && (
							<div className="game-result-overlay">
								<div className="game-result">
									{gameState === "won" && (winer ? winer + t("as_won") : t("victory"))}
									{gameState === "lose" && t("defeat")}
									{gameState === "draw" && t("draw")}
								</div>
								{autentified.current && !opLeft && (
									<button
										onClick={handleRematch}
										disabled={rematchSelf === 1}
									>
										{t("rematch")} {rematchSelf + rematchOp} / 2
									</button>

								)}

								<button onClick={handleQuit}>
									{t("quit")}
								</button>
							</div>
						)}
						{autentified.current && (
							<div className="puissance4-buttons">
								{Array.from({ length: 7 }).map((_, column) => (
									<button
										key={column}
										className="puissance4-column-button"
										onClick={() => handleColumnClick(column)}
										disabled={currentPlayer != self.current}
									>
										↓
									</button>
								))}
							</div>
						)}
						<div className="puissance4-board">
							{board.map((player, index) => (
								<div key={index} className="puissance4-cell">
									{player !== 0 && (
										<img src={getCoinImage(player as 1|2)} alt="token" className={`puissance4-piece player-${player}`}/>
									)}
								</div>
							))}
						</div>
					</div>
					{!gameState && <button onClick={handleQuit}>{!opAkf ? "Forfait" : "Quitter"}</button>}

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
								disabled={!connected}
							/>
							<button onClick={handleSendChat} disabled={!connected}>
								Envoyer
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Play