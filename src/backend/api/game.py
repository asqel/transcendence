import api
from rest_framework_simplejwt.authentication import JWTAuthentication
import secrets
import threading

auth = JWTAuthentication()

OPC_AUTH = 0xff
OPC_ISAUTH = 0xfe

OPC_CREATE = 0xf0
OPC_JOIN = 0xf1
OPC_JOIN2 = 0xf2
OPC_LEAVE = 0xf3
OPC_SEND = 0xfa
OPC_TEXT = 0xfb

OPC_PLACE = 0x10
OPC_PLACE2 = 0x11
OPC_WIN = 0x12
OPC_AGAIN = 0x13
OPC_WIN2 = 0x14
OPC_PLACE3 = 0x15

OPC_ERR_OK = 0
OPC_ERR_GENERAL = 1
OPC_ERR_ALREADY = 2
OPC_ERR_ALREADY_2 = 3
OPC_ERR_NEED_AUTH = 4
OPC_ERR_NOFOUND = 5
OPC_ERR_FULL = 6
OPC_ERR_LEN = 7
OPC_ERR_NEED_GAME = 8
OPC_ERR_NOT_PLAYING = 9
OPC_ERR_TURN = 10
OPC_ERR_RANGE = 11
OPC_ERR_START = 12

STATE_WAIT = 0
STATE_TURN1 = 1
STATE_TURN2 = 2
STATE_END = 4

STR_ENCODING = 'utf-8' 

games = {}

alphabet = "0123456789"
alphabet += ''.join([chr(i) for i in range(ord('a'), ord('z') + 1)])
alphabet += ''.join([chr(i) for i in range(ord('A'), ord('Z') + 1)])
game_id_len = 10
def new_game_id():
	return ''.join(secrets.choice(alphabet) for i in range(game_id_len))


def send(ws, opcode, fmt, *args):
	res = b''
	res += opcode.to_bytes(1, "little")
	current_arg = 0
	for i in fmt:
		arg = args[current_arg]
		if (i in ('bB')): # u8-64
			res += arg.to_bytes(1, "little")
		elif (i in ('wW')):
			res += arg.to_bytes(2, "little")
		elif (i in ('dD')):
			res += arg.to_bytes(4, "little")
		elif (i in ('qQ')):
			res += arg.to_bytes(8, "little")

		elif (i in ('cC')): # i8-64
			res += arg.to_bytes(1, "little", signed=True)
		elif (i in ('mM')):
			res += arg.to_bytes(2, "little", signed=True)
		elif (i in ('iI')):
			res += arg.to_bytes(4, "little", signed=True)
		elif (i in ('lL')):
			res += arg.to_bytes(8, "little", signed=True)

		elif (i in ('sS')):
			res += arg.encode(STR_ENCODING)
		else:
			raise Exception(f"Error format unknown {arg}")
		current_arg += 1
	ws.send(bytes_data=res)

def on_recv(ws, data: bytes):
	if (len(data) == 0):
		return # later add error code or maybe close ws #!TODO
	if (data[0] == OPC_AUTH):
		return ws_auth_user(ws, data)
	if (data[0] == OPC_ISAUTH):
		if (ws.user is not None):
			return send(ws, OPC_ISAUTH, "b", 1)
		else:
			return send(ws, OPC_ISAUTH, "b", 0)
	if (data[0] == OPC_CREATE):
		return create_game(ws, data)
	if (data[0] == OPC_JOIN):
		return join_game(ws, data)
	if (data[0] == OPC_SEND):
		return handle_text(ws, data)
	if (data[0] == OPC_PLACE):
		return place(ws, data)
	if (data[0] == OPC_AGAIN):
		return do_again(ws, data)

	ws.send(bytes_data=data)

def on_disco(ws, close_code):
	if (ws.game):
		with ws.game["lock"]:
			if (ws == ws.game["player1"]):
				if (ws.game["player2"]):
					send(ws.game["player2"], OPC_LEAVE, "s", ws.game["player1"].user.username)
					# !TODO handle forfeit
				ws.game["player1"] = None
			elif (ws == ws.game["player2"]):
				if (ws.game["player1"]):
					send(ws.game["player1"], OPC_LEAVE, "s", ws.game["player2"].user.username)
					# !TODO handle forfeit
				ws.game["player2"] = None
			else:
				if (ws in ws.game["spectators"]):
					ws.game["spectators"].remove(ws)

	if (ws.user):
		api.tmp.set(ws.user, "websocket", None)

def ws_auth_user(ws, data: bytes):
	if (ws.user is not None or ws.game is not None):
		return send(ws, OPC_AUTH, "b", OPC_ERR_ALREADY)
	try:
		token = data[1:].decode(encoding=STR_ENCODING)
		validated_token = auth.get_validated_token(token)
		ws.user = auth.get_user(validated_token)
	except:
		return send(ws, OPC_AUTH, "b", OPC_ERR_GENERAL)
	
	if (api.tmp.get(ws.user, "websocket")):
		ws.user = None
		return send(ws, OPC_AUTH, "b", OPC_ERR_ALREADY_2)
	api.tmp.set(ws.user, "websocket", ws)
	return send(ws, OPC_AUTH, "b", OPC_ERR_OK)

def create_game(ws, data):
	global games
	if (len(data) < 3):
		return send(ws, OPC_CREATE, "b", OPC_ERR_GENERAL)
	if (ws.user is None):
		return send(ws, OPC_CREATE, "b", OPC_ERR_NEED_AUTH)
	if (ws.game is not None):
		return send(ws, OPC_CREATE, "b", OPC_ERR_ALREADY)
	
	game = {}

	game_type = int.from_bytes(data[1:3], "little")
	game["type"] = game_type
	if (game_type not in (0, 1, 2)):
		return send(ws, OPC_CREATE, "b", OPC_ERR_GENERAL)

	if (game_type == 1):
		game["password"] = data[3:]

	game_id = new_game_id()
	game["player1"] = ws
	game["player2"] = None
	game["spectators"] = []
	game["board"] = [[0 for i in range(7)] for k in range(6)]
	game["state"] = 0
	game["again_1"] = 0
	game["again_2"] = 0
	game["who_start"] = 1
	game["lock"] = threading.Lock()
	games[game_id] = game
	ws.game = game

	return send(ws, OPC_CREATE, "s", game_id)

def join_game(ws, data):
	global games

	if (len(data) < 11):
		return send(ws, OPC_JOIN, "b", OPC_ERR_GENERAL)
	if (ws.game is not None):
		return send(ws, OPC_JOIN, "b", OPC_ERR_ALREADY)

	try:
		game_id = data[1:11].decode(STR_ENCODING)
		password = data[11:].decode(STR_ENCODING)
	except:
		return send(ws, OPC_JOIN, "b", OPC_ERR_GENERAL)

	game = games.get(game_id, None)
	if (game is None):
		return send(ws, OPC_JOIN, "b", OPC_ERR_NOFOUND)

	with game["lock"]:
		if (game["type"] == 1 and game["password"] != password):
			return send(ws, OPC_JOIN, "b", OPC_ERR_NOFOUND)
		if (game["type"] == 2):
			return send(ws, OPC_JOIN, "b", OPC_ERR_NOFOUND)

		if (ws.user):
			if (game["player1"] is None):
				game["player1"] = ws
			elif (game["player2"] is None):
				game["player2"] = ws
			else:
				return send(ws, OPC_JOIN, "b", OPC_ERR_FULL)
			ws.game = game

			send(ws, OPC_JOIN, "b", OPC_ERR_OK)
			if (game["player1"] is not None and game["player2"] is not None):
				game["state"] = STATE_TURN1
				send(game["player1"], OPC_JOIN2, "s", game["player2"].user.username)
				send(game["player2"], OPC_JOIN2, "s", game["player1"].user.username)
				for i in game["spectators"]:
					send(i, OPC_JOIN2, "s", game["player1"].user.username)
					send(i, OPC_JOIN2, "s", game["player2"].user.username)
			return 
		else:
			if (len(game["spectators"]) >= 100):
				return send(ws, OPC_JOIN, "b", OPC_ERR_FULL)
			game["spectators"].append(ws)
			ws.game = game
			send(ws, OPC_JOIN, "b", OPC_ERR_OK)
			if (game["player1"] is not None and game["player2"] is not None):
				send(ws, OPC_JOIN2, "s", game["player1"].user.username)
				send(ws, OPC_JOIN2, "s", game["player2"].user.username)
			board = game["board"]
			height = len(board)
			width = len(board[0])
			for x in range(width):
				for y in range(height - 1, -1, -1):
					if (board[y][x]):
						send(ws, OPC_PLACE3, "wb", x, board[y][x])
			return 
	
def handle_text(ws, data):
	if (ws.game is None):
		return send(ws, OPC_SEND, "b", OPC_ERR_NEED_GAME)

	try: message = data[1:].decode(STR_ENCODING).strip()
	except:
		return send(ws, OPC_SEND, "b", OPC_ERR_GENERAL)
	
	with ws.game["lock"]:
		if (len(message) > 100 or message == ""):
			return send(ws, OPC_SEND, "b", OPC_ERR_LEN)
		if (ws.user is not None):
			message = f"{ws.user.username}: {message}"
			p1 = ws.game["player1"]
			p2 = ws.game["player2"]
			if (p1):
				send(p1, OPC_TEXT, "s", message)
			if (p2):
				send(p2, OPC_TEXT, "s", message)
			return 
		else:
			for i in ws.game["spectators"]:
				send(i, OPC_TEXT, "s", message)

def place(ws, data):
	if (ws.game is None):
		return send(ws, OPC_PLACE, "b", OPC_ERR_NEED_GAME)
	if (ws.user is None):
		return send(ws, OPC_PLACE, "b", OPC_ERR_NOT_PLAYING)
	x = data[1:]
	if (len(x) != 2):
		return send(ws, OPC_PLACE, "b", OPC_ERR_GENERAL)
	x = int.from_bytes(x, "little")

	with ws.game["lock"]:
		player = 0
		if (ws == ws.game["player1"]):
			player = 1
		elif (ws == ws.game["player2"]):
			player = 2
		else:
			return send(ws, OPC_PLACE, "b", OPC_ERR_GENERAL)
		
		game = ws.game
		if (player == 1 and game["state"] != STATE_TURN1):
			return send(ws, OPC_PLACE, "b", OPC_ERR_TURN)
		elif (player == 2 and game["state"] != STATE_TURN2):
			return send(ws, OPC_PLACE, "b", OPC_ERR_TURN)
		elif (game["state"] not in (STATE_TURN1, STATE_TURN2)):
			return send(ws, OPC_PLACE, "b", OPC_ERR_START)

		if (x >= len(game["board"][0])):
			return send(ws, OPC_PLACE, "b", OPC_ERR_RANGE)
		if (game["board"][0][x]):
			return send(ws, OPC_PLACE, "b", OPC_ERR_RANGE)
		
		where = 0
		height = len(game["board"])
		while (1):
			if (where < height - 1 and game["board"][where + 1][x] == 0):
				where += 1
			else:
				break

		game["board"][where][x] = player
		send(game["player1"], OPC_PLACE2, "w", x)
		send(game["player2"], OPC_PLACE2, "w", x)
		for i in game["spectators"]:
			send(i, OPC_PLACE3, "wb", x, player)
		if (player == 1):
			game["state"] = STATE_TURN2
		else:
			game["state"] = STATE_TURN1
		
		is_win = 0
		if (api.board.do_win_top_left(game["board"], player, x, where)):
			is_win += 1
		elif (api.board.do_win_top_right(game["board"], player, x, where)):
			is_win += 1
		elif (api.board.do_win_vert(game["board"], player, x, where)):
			is_win += 1
		elif (api.board.do_win_horiz(game["board"], player, x, where)):
			is_win += 1
		
		if (is_win):
			send(game["player1"], OPC_WIN, "b", player)
			send(game["player2"], OPC_WIN, "b", player)
			game["state"] = STATE_END
			for i in game["spectators"]:
				send(i, OPC_WIN2, "s", ws.user.username)
		elif (api.board.is_board_full(game["board"])):
			game["state"] = STATE_END
			send(game["player1"], OPC_WIN, "b", 3)
			send(game["player2"], OPC_WIN, "b", 3)
			for i in game["spectators"]:
				send(i, OPC_WIN2, "s", "")
		# TODO gain achivement if is_win >= 2

def do_again(ws, data):
	if (ws.user is None):
		return 
	if (ws.game is None):
		return 

	with ws.game["lock"]:
		if (ws.game["state"] != STATE_END):
			return 
		if (ws.game["player1"] == ws):
			if (ws.game["again_1"] == 0):
				ws.game["again_1"] = 1
				send(ws.game["player2"], OPC_AGAIN, "")

		elif (ws.game["player2"] == ws):
			if (ws.game["again_2"] == 0):
				ws.game["again_2"] = 1
				send(ws.game["player1"], OPC_AGAIN, "")
		else:
			return
		
		if (ws.game["again_1"] and ws.game["again_2"]):
			for i in ws.game["spectators"]:
				send(i, OPC_AGAIN, "")
			ws.game["again_1"] = 0
			ws.game["again_2"] = 0
			for line in ws.game["board"]:
				for i in range(len(line)):
					line[i] = 0
			if (ws.game["who_start"] == 1):
				ws.game["state"] = STATE_TURN2
				ws.game["who_start"] = 2
			else:
				ws.game["state"] = STATE_TURN1
				ws.game["who_start"] = 1
