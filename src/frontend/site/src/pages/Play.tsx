import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next';
import { achievements } from "./Achievements";
import "./Play.css"

const OPC_AUTH = 0xff

const OPC_CREATE = 0xf0
const OPC_JOIN = 0xf1 //(id, skin)
const OPC_JOINED = 0xf2 //(id, skin, name)
const OPC_LEAVE = 0xf3
const OPC_CHAT = 0xfa


const OPC_TURN = 0x16 //(id)
const OPC_PLACE = 0x10
//const OPC_PLACED = 0x11 //(colon)
const OPC_PLACED_PLAYER = 0x15 //(id, colon)
const OPC_WIN = 0x12 //(id)
const OPC_WIN_SPEC = 0x14 //(name)
const OPC_REMATCH = 0x13


function Play() {
	const {t} = useTranslation()
	const navigate = useNavigate()
	const { user } = useAuth()

	const wsRef = useRef<WebSocket | null>(null)
	const [wsError, setWsError] = useState(false)

	const [connected, setConnected] = useState(false)
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
	const [winer, setWiner] = useState<string>("");
	const [currentPlayer, setCurrentPlayer] = useState<1|2>(1);
	const [gameState, setGameState] = useState<"won" | "lose" | "draw" | null>(null);
	const [rematchSelf, setRemathSelf] = useState<0|1>(0);
	const [rematchOp, setRemathOp] = useState<0|1>(0);
	const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [opAkf, setOpAkf] = useState<boolean>(false);

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
		try {
			wsRef.current?.send(new Uint8Array(bytes));
		}
		catch {
			console.log("sender error");
		}
	}

	function handleMessage(event: MessageEvent<any>) {
		const bytes = new Uint8Array(event.data)
		if (bytes[0] === OPC_AUTH) {
			if (bytes[1] === 0)
				autentified.current = true;
			else
				console.log("auth_error: ", bytes[1]);
		}
		else if (bytes[0] === OPC_CREATE) {
			if (bytes[1] === 0) {
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(2));
				setpartId(str);
			}
			else
				console.log("create_error: ", bytes[1]);
			
		}
		else if (bytes[0] === OPC_JOIN) {
			if (bytes[1] === 0) {
				self.current = bytes[2] as 1|2;
				selfSkin.current = bytes[3];
			}
			else {
				console.log("join_error: ", bytes[1]);
				setpartId(null);
			}
		}
		else if (bytes[0] === OPC_JOINED) {
			opponent.current = bytes[1] as 1|2;
			opponentSkin.current = bytes[2];
			const decoder = new TextDecoder();
			const str = decoder.decode(bytes.subarray(3));
			setChatMessages((prev) => [...prev, str + t("joining_string")]);
		}
		else if (bytes[0] === OPC_REMATCH) {
			setRemathOp(1);
			if (!autentified.current) {
				setRemathSelf(1);
			}
		}
		else if (bytes[0] === OPC_LEAVE) {
			console.log("leave_log");
			if (!autentified.current)
				window.location.href = "/play";
			setOpLeft(true);
		}
		else if (bytes[0] === OPC_CHAT) {
			if (bytes[1] === 0) {
				const decoder = new TextDecoder();
				const str = decoder.decode(bytes.subarray(2));
				setChatMessages((prev) => [...prev, str]);
			}			
		}

		else if (bytes[0] === OPC_TURN) {
			const player = bytes[1] as (1|2);
			setCurrentPlayer(player);
			console.log("turn: ", player);
			if (player === opponent.current)
				startTurnTimer();
			else
				stopTurnTimer();
		}
		else if (bytes[0] === OPC_PLACE) {
			if (bytes[1] !== 0)
				console.log("placed_error:" + bytes[1]);
		}

		else if (bytes[0] === OPC_PLACED_PLAYER) {
			const player = bytes[1] as (1|2);
			const column = bytes[2] | (bytes[3] << 8)
			playColumn(column, player);
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
	}

	function handleCopy() {
		if (partId) {
			navigator.clipboard.writeText(partId.toString());
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
		sender(OPC_REMATCH);
	}

	function handleQuit() {
		sender(OPC_LEAVE);
		autentified.current = false;
		setpartId(null);
		setGameState(null);
		setBoard(Array(42).fill(0));
		setRemathSelf(0);
		setRemathOp(0);
		setWiner("");
		setChatMessages([]);
		setOpAkf(false);
		navigate('/play/')
	}

	function handleSendChat() {
		if (!chatInput.trim())
			return
		sender(OPC_CHAT, chatInput.trim())
		setChatInput("")
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



	useEffect(() => {
        if (wsRef.current) {
            return;
        }

        const ws = new WebSocket(`wss://${window.location.host}/ws/game/`);
        ws.binaryType = "arraybuffer";
        
        ws.onopen = () => {
            setConnected(true);
            setWsError(false);
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

			setBoard(Array(42).fill(0))

			setRemathSelf(0)
			setRemathOp(0)
		}
	}, [rematchSelf, rematchOp])


	if (wsError) {
		return (
			<div className="page">
				<p className="ws-error">
					Impossible de se connecter au serveur. Réessaie plus tard.
				</p>
			</div>
		)
	}
	if (!connected) {
		return (
			<div className="page">
				<p>
					Loading
				</p>
			</div>
		)
	}
	return (
		<div className="page">
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
						<button onClick={handleSpectate}>
							Spectate
						</button>
						{user && (
							<button onClick={handleJoin}>
								Join
							</button>
						)}
					</div>

					{user && (
						<button onClick={handleCreateGame}>
							Créer une partie
						</button>
					)}
				</div>
				</>
			)}



			{partId && (
				<div className="game-layout">
					<div className="puissance4">
						<div className="game-controls">
							<button onClick={handleCopy}>Copy</button>
							{!gameState && <button onClick={handleQuit}>{!opAkf ? "Forfait" : "Quitter"}</button>}
						</div>
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
						<div className="puissance4-board">
							{Array.from({ length: 7 }).map((_, column) => (
						    	<button
									className="puissance4-column"
									key={column}
									onClick={() => handleColumnClick(column)}
									disabled={currentPlayer != self.current}
						    	>
						    		{Array.from({ length: 6 }).map((_, row) => {
						    			const index = row * 7 + column;
						    			const player = board[index];
						    			return (
						    				<div key={index} className="puissance4-cell">
						    					{player !== 0 && (
						    						<img
						    						  src={getCoinImage(player as 1 | 2)}
						    						  alt="token"
						    						  className={`puissance4-piece player-${player}`}
						    						/>
						    					)}
						    				</div>
						    			);
						    		})}
						    	</button>
							))}
						</div>
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
				</div>
			)}
		</div>
	)
}

export default Play