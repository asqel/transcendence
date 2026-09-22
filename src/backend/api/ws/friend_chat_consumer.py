from channels.generic.websocket import WebsocketConsumer
import api
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from models.models import FriendRequest, Friendness, FriendMessage
from django.db.models import Q
import random

auth = JWTAuthentication()

class FriendChatConsumer(WebsocketConsumer):
	def connect(self):
		self.accept()
		self.user = None
		self.talking_to = None
	
	def disconnect(self, close_code):
		if (self.user is None):
			return 

		try:
			api.tmp.get(self.user, "friend-chat").remove(self)
		except:
			...

	def receive(self, text_data=None, bytes_data=None):
		api.utils.log(bytes_data)
		if (text_data):
			return 
		if (len(bytes_data) < 1):
			return
		if (bytes_data[0] == 0x01):
			if (self.user is not None):
				api.tmp.get(self.user, "friend-chat").remove(self)
			try:
				validated_token = auth.get_validated_token(bytes_data[1:].decode(encoding="utf-8"))
				self.user = auth.get_user(validated_token)
				lst = api.tmp.get(self.user, "friend-chat")
				if (lst is None):
					api.tmp.set(self.user, "friend-chat", [self])
				else:
					lst.append(self)
				return self.send(bytes_data=b'\x01\x00')
			except:
				return self.send(bytes_data=b'\x01\x01')

		if (self.user is None):
			return 

		if (bytes_data[0] == 0x02):
			try:
				res = api.friend.send_request(self.user, bytes_data[1:].decode(encoding="utf-8"))
				
				return self.send(bytes_data=b'\x02' + res.to_bytes(1))

			except Exception as e:
				api.utils.log(e)
				return self.send(bytes_data=b'\x02\x01')

		if (bytes_data[0] == 0x03):
			try:
				requests = FriendRequest.objects.filter(to_who=self.user)

				res = b'\x03\x00'
				for i in requests:
					res += i.from_who.username.encode(encoding="utf-8")
					res += b'/'
					api.utils.log(i.from_who)
				api.utils.log(requests)
				if (len(res) > 2 and res[-1] == ord('/')):
					res = res[:-1]

				return self.send(bytes_data=res)
			except:
				return self.send(bytes_data=b'\x03\x01')

		if (bytes_data[0] == 0x04):
			try:
				state = (bytes_data[1] == ord('1'))
				name = bytes_data[2:].decode(encoding='utf-8')

				res = api.friend.accept_request(self.user, name, state)
				if (res == 0 and state == True):
					api.send_req_accept(name, self.user.username)

				return self.send(bytes_data=b'\x04\x00' + res.to_bytes(1))
			except:
				return self.send(bytes_data=b'\x04\x01')

		if (bytes_data[0] == 0x05):
			try:
				friends = Friendness.objects.filter(Q(lesser=self.user) | Q(greater=self.user))
				res = b'\x05\x00'
				for i in friends:
					if (i.lesser.id == self.user.id):
						res += i.greater.username.encode(encoding='utf-8')
					else:
						res += i.lesser.username.encode(encoding='utf-8')
					res += b'/'

				if (len(res) > 2 and res[-1] == ord('/')):
					res = res[:-1]
				return self.send(bytes_data=res)
			except:
				return self.send(bytes_data=b'\x05\x01')

		if (bytes_data[0] == 0x08):
			try:
				name = bytes_data[1:].decode(encoding="utf-8")
				user2 = User.objects.filter(username=name).first()
				if (user2 is None):
					return self.send(bytes_data=b'\x08\x01')
				friend = None
				messages = None
				if (self.user.id < user2.id):
					friend = Friendness.objects.filter(lesser=self.user, greater=user2).first()
					messages = FriendMessage.objects.filter(lesser=self.user, greater=user2)
				else:
					friend = Friendness.objects.filter(lesser=user2, greater=self.user).first()
					messages = FriendMessage.objects.filter(lesser=user2, greater=self.user)

				if (friend is None):
					return self.send(bytes_data=b'\x08\x02')
				friend.delete()
				
				for i in messages:
					i.delete()

				return self.send(bytes_data=b'\x08\x00')
			except Exception as e:
				api.utils.log(e)
				return self.send(bytes_data=b'\x08\x01')
				
		if (bytes_data[0] == 0x06):
			try:
				user2 = User.objects.filter(username=bytes_data[1:].decode(encoding="utf-8")).first()
				if (user2 is None):
					return self.send(bytes_data=b'\x06\x02')

				if (self.user.id < user2.id):
					friend = Friendness.objects.filter(lesser=self.user, greater=user2).first()
				else:
					friend = Friendness.objects.filter(lesser=user2, greater=self.user).first()
				if (friend is None):
					return self.send(bytes_data=b'\x06\x03')

				self.send(bytes_data=b'\x06\x00' + user2.username.encode(encoding="utf-8"))

				self.talking_to = user2
				for i in FriendMessage.objects.filter(lesser=friend.lesser, greater=friend.greater):
					res = b'\x07\x00'
					if i.is_from_leser and self.user.id < user2.id:
						res += b'\x00'
					elif i.is_from_leser and self.user.id > user2.id:
						res += b'\x01'
					elif not i.is_from_leser and self.user.id < user2.id:
						res += b'\x01'
					else:
						res += b'\x00'
					res += i.message.encode(encoding="utf-8")
					self.send(bytes_data=res)
				return
			except Exception as e:
				api.utils.log(e)
				return self.send(bytes_data=b'\x06\x01')

		if (bytes_data[0] == 0x07):
			try:
				if (self.talking_to is None):
					return self.send(bytes_data=b'\x07\x02')
				msg = bytes_data[1:].decode(encoding="utf-8").strip()
				friend = api.friend.find_friendness(self.user, self.talking_to)
				if (friend is None):
					self.talking_to = None
					self.send(bytes_data=b'\x07\x02')
					return
				if (len(msg) > 100 or len(msg) < 1):
					return self.send(bytes_data=b'\x07\x03')
				if (self.user.id < self.talking_to.id):
					FriendMessage.objects.create(lesser=self.user, greater=self.talking_to, is_from_leser=True, message=msg)
				else:
					FriendMessage.objects.create(lesser=self.talking_to, greater=self.user, is_from_leser=False, message=msg)
					
				api.friend.inform_messsage(msg, self.user, self.talking_to)
				return self.send(bytes_data=b'\x07\x00\x00' + msg.encode(encoding='utf-8'))
			except Exception as e:
				api.utils.log(e, e.format_exec())
				return self.send(bytes_data=b'\x07\x01')
