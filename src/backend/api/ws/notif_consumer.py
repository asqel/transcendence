from channels.generic.websocket import WebsocketConsumer
import json
import api
from rest_framework_simplejwt.authentication import JWTAuthentication

auth = JWTAuthentication()

class NotifConsumer(WebsocketConsumer):

	def connect(self):
		self.accept()
		self.user = None
		api.utils.log("BBB")

	def disconnect(self, close_code):
		api.utils.log("AAAAAAAA")
		if (self.user is None):
			return 

		api.tmp.get(self.user, "notif").remove(self)

	def receive(self, text_data=None, bytes_data=None):
		if bytes_data is not None:
			api.utils.log("|", text_data, "|")
			return 
		api.utils.log("|", text_data, "|")

		if (self.user is not None):
			api.tmp.get(self.user, "notif").remove(self)

		try:
			validated_token = auth.get_validated_token(text_data)
			self.user = auth.get_user(validated_token)
			lst = api.tmp.get(self.user, "notif")
			if (lst is None):
				api.tmp.set(self.user, "notif", [self])
			else:
				lst.append(self)
			return self.send(bytes_data=b'\xFE');

		except Exception as e:
			api.utils.log(e)
			return self.send(bytes_data=b'\xFF');

	def send_msg_notif(self, username):
		self.send(bytes_data=b'\x00' + username.encode(encoding="utf-8"))
	
	def send_ach_notif(self, ach):
		self.send(bytes_data=b'\x01' + ach.to_bytes(1, "little"))
		
	def send_friend_req(self, username):
		self.send(bytes_data=b'\x02' + username.encode(encoding="utf-8"))
