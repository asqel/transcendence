import { useEffect, useRef, useState } from "react"

function Home() {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [autentified, setAutentified] = useState(false)
  const [partId, setpartId] = useState<string|null>(null)

  useEffect(() => {
    return () => wsRef.current?.close()
  }, [])

  function handleMessage(event: MessageEvent<any>){
    const bytes = new Uint8Array(event.data)

    if (bytes[0] === 0xff) {
      if (bytes[1] === 0)
        setAutentified(true); 
    }
    if (bytes[0] === 0xf0) {
      const decoder = new TextDecoder();
      const str = decoder.decode(bytes.subarray(1));
      setpartId(str);
    }
  }

  function handleConnect() {
    const ws = new WebSocket(`wss://${window.location.host}/ws/api/`)

    ws.binaryType = "arraybuffer"
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = handleMessage

    wsRef.current = ws
  }

  function sender(nb: number, val: string|number|null = null) {
    const bytes: Array<number> = [];
    bytes.push(nb);

    if (typeof val === "string") {
      const encoder = new TextEncoder();
      const valBytes = encoder.encode(val);
      for (const i of valBytes) {
        bytes.push(i)
      }

    }
    else if (typeof val === "number") {
      bytes.push(val & 0xff);
      bytes.push((val >> 8) & 0xff)
    }

    wsRef.current?.send(new Uint8Array(bytes));

  }

  return (
    <div>
      <h1>Accueil</h1>
      <button onClick={handleConnect} disabled={connected}>
        {connected ? "Connecté au WS" : "Se connecter au WS"}
      </button>
      {connected && (
        <button onClick={() => sender(0xff, localStorage.getItem("access"))}>
          s'autentifier dans le WS
        </button>
      )}
      {autentified && (
        <button onClick={() => sender(0xf0)}>
          Creer la partie
        </button>
      )}
      {partId && (
        <p>{partId}</p>
      )}
    </div>
  )
}

export default Home