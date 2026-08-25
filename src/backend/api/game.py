import api

def on_recv(ws, data: bytes):
	api.utils.log(f"le message ? {data} ws ? {ws}")
	ws.send(bytes_data=data)

def on_disco(ws, close_code):
	api.utils.log("il est parti... (snif :( )")
