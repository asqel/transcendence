from channels.generic.websocket import WebsocketConsumer
import json
import api


class GameConsumer(WebsocketConsumer):

	def connect(self):
		self.accept()
		self.player = None
		self.game = None
		self.user = None
		api.utils.log("websocket has opened")

	def disconnect(self, close_code):
		api.utils.log("websocket has closed")
		api.game.on_disco(self, close_code)

	def receive(self, text_data=None, bytes_data=None):
		if text_data is not None:
			self.close(code=4000) # no text allowed (ig)
			return 
		api.game.on_recv(self, bytes_data)
