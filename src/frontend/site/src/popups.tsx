import { useState, useRef, useEffect } from "react"
import { useAuth } from "./context/AuthContext"
import "./popups.css"

function Popups() {
    const wsRef = useRef<WebSocket | null>(null)
    const [achievementPopup, setAchievementPopup] = useState<string | null>(null)
    const { user } = useAuth()

    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const shouldReconnectRef = useRef(true)

    function showAchievement(name: string) {
        setAchievementPopup(name)
        setTimeout(() => {
            setAchievementPopup(null)
        }, 4000)
    }

    function handleMessage(event: MessageEvent<any>) {
        const bytes = new Uint8Array(event.data)
        if (bytes[0] === 0){}
        else if (bytes[0] === 1) {
            const decoder = new TextDecoder();
            const str = decoder.decode(bytes.subarray(1));
            showAchievement(str);
        }
        else if (bytes[0] === 0xFE) {
            showAchievement("REussi");
        }
        else if (bytes[0] === 0xFF) {
            showAchievement("FAIl");
        }
        else if (bytes[0] === 0x00){
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
                <div className="achievement-popup">
                    <div className="achievement-popup-title">
                        🏆 Achievement débloqué !
                    </div>
                    <div className="achievement-popup-name">
                        {achievementPopup}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Popups