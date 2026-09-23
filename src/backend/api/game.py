import api
from rest_framework_simplejwt.authentication import JWTAuthentication
from models.models import BIO_MAX_CHAR, Profile, Stats, EmailConfirm
import models.models as models
import secrets
import threading
from django.utils import timezone
from datetime import timedelta

auth = JWTAuthentication()

OPC_AUTH = 0xff
OPC_ISAUTH = 0xfe

OPC_CREATE = 0xf0
OPC_JOIN = 0xf1
OPC_JOIN2 = 0xf2
OPC_LEAVE = 0xf3
OPC_SEND = 0xfa

OPC_PLACE = 0x10
OPC_WIN = 0x12
OPC_AGAIN = 0x13
OPC_WIN2 = 0x14
OPC_PLACE3 = 0x15
OPC_SET_TURN = 0x16


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
	for i in range(20):
		res = ''.join(secrets.choice(alphabet) for i in range(game_id_len))
		if (res not in games):
			return res
	return None


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
		return 
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
	if (data[0] == OPC_LEAVE):
		return do_leave(ws, data)

	ws.send(bytes_data=data)

AFK_TIME = timedelta(seconds=20)

def do_leave(ws, data):
	if (ws.player):
		ws.player.asked_leave = True
	if (ws.game):
		on_disco(ws, 0)
		ws.game = None
		ws.player = None
		ws.user = None

def on_disco(ws, close_code):
	if (ws.game):
		ws.game.on_disco(ws)
	if (ws.user is not None):
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
	
	api.utils.log(api.tmp.get(ws.user, "websocket"), ws, "CC")
	if (api.tmp.get(ws.user, "websocket")):
		ws.user = None
		return send(ws, OPC_AUTH, "b", OPC_ERR_ALREADY_2)
	api.tmp.set(ws.user, "websocket", ws)
	return send(ws, OPC_AUTH, "b", OPC_ERR_OK)

def create_game(ws, data):
	global games
	api.utils.log(ws, data, ws.game, ws.user)
	if (len(data) < 3):
		return send(ws, OPC_CREATE, "b", OPC_ERR_GENERAL)
	if (ws.user is None):
		return send(ws, OPC_CREATE, "b", OPC_ERR_NEED_AUTH)
	if (ws.game is not None):
		return send(ws, OPC_CREATE, "b", OPC_ERR_ALREADY)
	try:
		password = data[3:].decode(STR_ENCODING)
	except:
		return send(ws, OPC_CREATE, "b", OPC_ERR_GENERAL)
	
	game_type = int.from_bytes(data[1:3], "little")
	game_id = new_game_id()
	if (game_id is None):
		return send(ws, OPC_CREATE, "b", OPC_ERR_GENERAL)
	game = Game(game_type, game_id, password)
	games[game_id] = game

	ws.game = game
	ws.player = Player(ws, ws.user, 1)
	game.player_1 = ws.player
	game.player_1.game = game

	send(ws, OPC_CREATE, "bs", OPC_ERR_OK, game_id)
	stats = Stats.objects.filter(user=ws.user).first()
	send(ws, OPC_JOIN, "bbb", OPC_ERR_OK, 1, stats.used_skin)

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
	if (game is None or game.password != password):
		return send(ws, OPC_JOIN, "b", OPC_ERR_NOFOUND)
	if (ws.user is None):
		return game.join_spectator(ws)
	with game.lock:
		if (game.state == STATE_WAIT):
			game.join(ws)
		elif (game.state in (STATE_TURN1, STATE_TURN2)):
			game.reconnect(ws)
		else:
			return send(ws, OPC_JOIN, "b", OPC_ERR_NOFOUND)
	
def handle_text(ws, data):
	if (ws.game is None):
		return send(ws, OPC_SEND, "b", OPC_ERR_NEED_GAME)

	try:
		message = data[1:].decode(STR_ENCODING).strip()
	except:
		return send(ws, OPC_SEND, "b", OPC_ERR_GENERAL)
	
	with ws.game.lock:
		if (len(message) > 100 or message == ""):
			return send(ws, OPC_SEND, "b", OPC_ERR_LEN)
		ws.game.handle_text(ws.player, message)

def place(ws, data):
	if (ws.game is None):
		return send(ws, OPC_PLACE, "b", OPC_ERR_NEED_GAME)
	if (ws.player is None):
		return send(ws, OPC_PLACE, "b", OPC_ERR_NOT_PLAYING)
	x = data[1:]
	if (len(x) != 2):
		return send(ws, OPC_PLACE, "b", OPC_ERR_GENERAL)
	x = int.from_bytes(x, "little")

	send(ws, OPC_PLACE, "b", ws.game.on_place(ws, x))

def do_again(ws, data):
	if (ws.game is None):
		return 
	ws.game.do_again(ws)

def compute_elo(elo_1, elo_2, win_state, k=32):
    expected_1 = 1 / (1 + 10 ** ((elo_2 - elo_1) / 400))
    expected_2 = 1 / (1 + 10 ** ((elo_1 - elo_2) / 400))

    if win_state == 1:
        score_1, score_2 = 1, 0
    elif win_state == 0:
        score_1, score_2 = 0.5, 0.5

    new_elo_1 = round(elo_1 + k * (score_1 - expected_1))
    new_elo_2 = round(elo_2 + k * (score_2 - expected_2))

    return new_elo_1, new_elo_2


class Player:
	def __init__(self, ws, user, idx: int):
		self.ws = ws
		self.user = user
		self.idx = idx
		self.game = None
		self.number_placed = 0
		self.asked_leave = False
	
	def send(self, *args, **kwargs):
		if self.ws is not None:
			send(self.ws, *args, **kwargs)

class Game:
	def __init__(self, game_type, game_id, password=""):
		self.player_1 = None
		self.player_2 = None
		self.password = password
		self.type = game_type
		self.spectators = []
		self.state = 0
		self.width = 7
		self.height = 6
		self.board = [[0 for i in range(self.width)] for k in range(self.height)]
		self.who_start = 1
		self.again_state = 0
		self.again_count = 0
		self.id = game_id
		self.lock = threading.Lock()
		self.last_played = timezone.now()
		self.is_remove = False
	
	def join(self, ws):
		ws.player = Player(ws, ws.user, 2)
		ws.game = self
		self.player_2 = ws.player
		ws.player.game = self

		stats = Stats.objects.filter(user=ws.user).first()
		self.player_2.send(OPC_JOIN, "bbb", OPC_ERR_OK, 2, stats.used_skin)

		self.state = STATE_TURN1
		stats1 = Stats.objects.filter(user=self.player_1.user).first()
		stats2 = Stats.objects.filter(user=self.player_2.user).first()
		self.player_1.send(OPC_JOIN2, "bbs", 2, stats2.used_skin, self.player_2.user.username)
		self.player_2.send(OPC_JOIN2, "bbs", 1, stats1.used_skin, self.player_1.user.username)

		self.to_spectators(OPC_JOIN2, "bbs", 1, stats1.used_skin, self.player_1.user.username)
		self.to_spectators(OPC_JOIN2, "bbs", 2, stats2.used_skin, self.player_2.user.username)

		self.player_1.send(OPC_SET_TURN, "b", STATE_TURN1)
		self.player_2.send(OPC_SET_TURN, "b", STATE_TURN1)

		self.reset_afk()
	
	def join_spectator(self, ws):
		with self.lock:
			if (len(self.spectators) >= 100):
				return send(ws, OPC_JOIN, "b", OPC_ERR_FULL)

			self.spectators.append(ws)
			ws.game = self
			send(ws, OPC_JOIN, "b", OPC_ERR_OK)
			if (self.player_1 and self.player_2):
				stats1 = Stats.objects.filter(user=self.player_1.user).first()
				stats2 = Stats.objects.filter(user=self.player_2.user).first()
				send(ws, OPC_JOIN2, "bbs", 1, stats1.used_skin, self.player_1.user.username)
				send(ws, OPC_JOIN2, "bbs", 2, stats2.used_skin, self.player_2.user.username)
			for x in range(self.width):
				for y in range(self.height):
					if (self.board[y][x]):
						send(ws, OPC_PLACE3, "bw", self.board[y][x], x)
			
	
	def get_other_player(self, player: Player) -> Player:
		if (player is None):
			return None
		if (player.idx == 1):
			return self.player_2
		return self.player_1
	
	def get_player_from_idx(self, idx) -> Player:
		if (idx == 1):
			return self.player_1
		if (idx == 2):
			return self.player_2
	
	def get_player_from_ws(self, ws) -> Player | None:
		if (self.player_1 and ws == self.player_1.ws):
			return self.player_1
		if (self.player_2 and ws == self.player_2.ws):
			return self.player_2
		return None
	
	def set_again(self, idx):
		self.again_state |= (1 << (idx - 1))
	
	def clear_again(self, idx):
		self.again_state &= ~(1 << (idx - 1))
	
	def is_again(self, idx = 0) -> bool:
		if (idx == 0):
			return self.again_state == 0b11
		return bool(self.again_state & (1 << (idx - 1)))
	
	def clear_board(self):
		for line in self.board:
			for i in range(len(line)):
				line[i] = 0
	
	def do_again(self, ws):
		with self.lock:
			player = self.get_player_from_ws(ws)
			api.utils.log(self, ws, self.again_state, player)
			if (player is None):
				return 
			if (self.state != STATE_END):
				return 

			if (self.is_again(player.idx)):
				return
			self.set_again(player.idx)
			self.get_other_player(player).send(OPC_AGAIN, "")

			if (not self.is_again()):
				return ;

			self.to_spectators(OPC_AGAIN, "")
			self.again_state = 0
			self.clear_board()
			if (self.who_start == 1):
				self.who_start = 2
				self.state = STATE_TURN2
			else:
				self.who_start = 1
				self.state = STATE_TURN1

			self.player_1.send(OPC_SET_TURN, "b", self.state)
			self.player_2.send(OPC_SET_TURN, "b", self.state)

			self.again_count += 1
			if (self.again_count == 5):
				api.ach.gain(self.player_1.user, api.ach.ACH_INF)
				api.ach.gain(self.player_2.user, api.ach.ACH_INF)
				self.reset_afk()
	
	def is_turn(self, player: Player) -> bool:
		if (self.state == STATE_TURN1 and player.idx == 1):
			return True
		if (self.state == STATE_TURN2 and player.idx == 2):
			return True

		return False
	
	def change_turn(self):
		if (self.state == STATE_TURN1):
			self.state = STATE_TURN2
		elif (self.state == STATE_TURN2):
			self.state = STATE_TURN1
		self.player_1.send(OPC_SET_TURN, "b", self.state)
		self.player_2.send(OPC_SET_TURN, "b", self.state)
		self.reset_afk()
	
	def on_place(self, ws, x) -> int:
		with self.lock:
			player = self.get_player_from_ws(ws)
			if (not player):
				return OPC_ERR_NOT_PLAYING
			if (not self.is_turn(player)):
				return OPC_ERR_TURN
			if (x < 0 or x >= self.width):
				return OPC_ERR_RANGE

			if (self.board[0][x] != 0):
				return OPC_ERR_RANGE

			y = self.height - 1
			while (self.board[y][x] != 0):
				y -= 1
			self.board[y][x] = player.idx
			player.number_placed += 1

			self.get_other_player(player).send(OPC_PLACE3, "bw", player.idx, x)
			player.send(OPC_PLACE3, "bw", player.idx, x)
			self.to_spectators(OPC_PLACE3, "bw", x, player.idx)
			self.change_turn()
			self.check_win(player, x, y)

			return OPC_ERR_OK

	def to_spectators(self, *args, **kwargs):
		for i in self.spectators:
			send(i, *args, **kwargs)

	def check_win(self, player: Player, x: int, y: int):
		is_win = 0
		if (api.board.do_win_top_left(self.board, player.idx, x, y)):
			is_win += 1
		if (api.board.do_win_top_right(self.board, player.idx, x, y)):
			is_win += 1
		if (api.board.do_win_horiz(self.board, player.idx, x, y)):
			is_win += 1
		if (api.board.do_win_vert(self.board, player.idx, x, y)):
			is_win += 1
			api.ach.gain(player.user, api.ach.ACH_VERT)

		if (is_win >= 2):
			api.ach.gain(player.user, api.ach.ACH_SECRET)

		if (is_win):
			self.player_1.send(OPC_WIN, "b", player.idx)
			self.player_2.send(OPC_WIN, "b", player.idx)
			self.to_spectators(OPC_WIN2, "s", player.user.username)

			self.state = STATE_END
			self.register_win(player.idx)

		elif (api.board.is_board_full(self.board)):
			self.player_1.send(OPC_WIN, "b", 3)
			self.player_2.send(OPC_WIN, "b", 3)
			self.to_spectators(OPC_WIN2, "s", "")

			api.ach.gain(self.player_1.user, api.ach.ACH_TIE)
			api.ach.gain(self.player_2.user, api.ach.ACH_TIE)

			self.state = STATE_END
			self.register_win(0)

	def register_win(self, who: int):
		models.Game.objects.create(user1=self.player_1.user, user2=self.player_2.user, winner=who)

		if (who != 0):
			winner = self.get_player_from_idx(who)
			looser = self.get_other_player(winner)

			winner_stats = Stats.objects.filter(user=winner.user).first()
			looser_stats = Stats.objects.filter(user=looser.user).first()

			winner_stats.number_win += 1
			winner_stats.number_placed += winner.number_placed
			if (winner_stats.streak < 0):
				winner_stats.streak = 1
			else:
				winner_stats.streak += 1
				if (winner_stats.streak >= 5):
					api.ach.gain(winner.user, api.ach.ACH_WIN_STREAK)

			looser_stats.number_loss += 1
			looser_stats.number_placed += looser.number_placed
			if (looser_stats.streak > 0):
				looser_stats.streak = -1
			else:
				looser_stats.streak -= 1
				if (looser_stats.streak <= 5):
					api.ach.gain(looser.user, api.ach.ACH_POOP)

			if (7 <= timezone.now().hour < 20):
				api.ach.gain(winner.user, api.ach.ACH_SUN)
			else:
				api.ach.gain(winner.user, api.ach.ACH_MOON)
				
			winner_stats.elo, looser_stats.elo = compute_elo(winner_stats.elo, looser_stats.elo, 1)

			winner_stats.save()
			looser_stats.save()
		else:
			stats1 = Stats.objects.filter(user=self.player_1.user).filter()
			stats2 = Stats.objects.filter(user=self.player_2.user).filter()

			stats1.streak = 0
			stats2.streak = 0
			stats1.number_placed += self.player_1.number_placed
			stats2.number_placed += self.player_2.number_placed
			stat1.elo, stats2.elo = compute_elo(stats1.elo, stats2.elo, 0)
			stats1.save()
			stats2.save()

		winner.number_placed = 0
		looser.number_placed = 0
	
	def reset_afk(self):
		self.last_played = timezone.now()
	
	def handle_text(self, player: Player | None, message: str):
		if (player):
			if (message.upper() == 'GG' and self.state == STATE_END):
				api.ach.gain(player.user, api.ach.ACH_GG)
			if (message == ':3'):
				api.ach.gain(player.user, api.ach.ACH_CUTE)
			api.ach.gain(player.user, api.ach.ACH_EXCL)

			message = f"{player.user.username}: {message}"
			if (self.player_1):
				self.player_1.send(OPC_SEND, "bs", OPC_ERR_OK, message)
			if (self.player_2):
				self.player_2.send(OPC_SEND, "bs", OPC_ERR_OK, message)

		else:
			self.to_spectators(OPC_TEXT, "bs", OPC_ERR_OK, message)
	
	def on_disco(self, ws):
		global games
		with self.lock:
			if (ws.game.state == STATE_WAIT):
				player = self.get_player_from_ws(ws)
				if (not player):
					return self.remove_spectator(ws)

				self.to_spectators(OPC_LEAVE, "")
				self.clear_spectators()

				del games[self.id]
				return 

			if (ws.game.state == STATE_END):
				player = self.get_player_from_ws(ws)
				if (not player):
					return self.remove_spectator(ws)

				opponent = self.get_other_player(player)
				if (opponent):
					opponent.send(OPC_LEAVE, "")

				self.to_spectators(OPC_LEAVE, "")
				self.clear_spectators()

				self.remove_player(player.idx, True)

				if (not self.is_remove):
					del games[self.id]
					self.is_remove = True
				return

			player = self.get_player_from_ws(ws)
			if (not player):
				return self.remove_spectator(ws)

			opponent = self.get_other_player(player)
			if (not player.asked_leave):
				player.ws = None
				if (opponent.ws is None):
					del games[self.id]
					self.to_spectators(OPC_LEAVE, "")
					self.clear_spectators()
				return 

			if (self.is_turn(player)):
				api.ach.gain(opponent.user, api.ach.ACH_FORF)
				opponent.send(OPC_LEAVE, "")
				opponent.send(OPC_WIN, "b", opponent.idx)
				self.register_win(opponent.idx);
				return 

			if (self.last_played + AFK_TIME < timezone.now()):
				api.ach.gain(player.user, api.ach.ACH_FORF)
				opponent.send(OPC_WIN, "b", player.idx)
				opponent.send(OPC_LEAVE, "")
				self.register_win(player.idx)
				self.state = STATE_END
				self.remove_player(player.idx, True)
				self.is_remove = True
				del games[self.id]
				return 

			api.ach.gain(opponent.user, api.ach.ACH_FORF)
			opponent.send(OPC_LEAVE, "");
			opponent.send(OPC_WIN, "b", opponent.idx)
			self.register_win(opponent.idx)
			self.state = STATE_END
			self.remove_player(player.idx, True)
			self.is_remove = True
			del games[self.id]
	
	def reconnect(self, ws):
		if (self.player_1.ws is not None and self.player_2.ws is not None):
			return send(ws, OPC_JOIN, "b", OPC_ERR_FULL)
		who = None
		if (self.player_1.user.username == ws.user.username):
			who = self.player_1
		elif (self.player_2.user.username == ws.user.username):
			who = self.player_2
		else:
			send(ws, OPC_JOIN, "b", OPC_ERR_FULL)

		who.ws = ws
		ws.game = self
		ws.player = who

		for x in range(self.width):
			for y in range(self.height):
				if (self.board[y][x]):
					who.send(OPC_PLACE3, "bw", self.board[y][x], x)

		opponent = self.get_other_player(who)
		stats = Stats.objects.filter(user=opponent.user).first()
		who.send(OPC_JOIN2, "bbs", opponent.idx, stats.used_skin, opponent.user.username)

		stats = Stats.objects.filter(user=who.user).first()
		who.send(OPC_JOIN, "bbb", OPC_ERR_OK, who.idx, stats.used_skin)

		who.send(OPC_SET_TURN, "b", self.state)
	
	def remove_player(self, idx, full):
		player = self.get_player_from_idx(idx)
		player.ws = None
		if (full and idx == 1):
			self.player_1 = None
		elif (full and idx == 2):
			self.player_2 = None
	def remove_spectator(self, ws):
		try:
			self.spectators.remove(ws)
		except:
			...

	def clear_spectators(self):
		for i in self.spectators:
			i.game = None
		self.spectators = []
