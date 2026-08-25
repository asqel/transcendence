from channels.generic.websocket import WebsocketConsumer
import json
import api


class Consumer(WebsocketConsumer):
	is_authenticated = False

	def connect(self):
		self.accept()

	def disconnect(self, close_code):
		api.game.on_disco(self, close_code)

	def receive(self, text_data=None, bytes_data=None):
		if text_data is not None:
			self.close(code=4000) # no text allowed (ig)
			return 
		api.game.on_recv(self, bytes_data)
