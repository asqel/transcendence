from channels.generic.websocket import WebsocketConsumer
import api
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.models import User
from models.models import FriendRequest, Friendness
from django.db.models import Q
import random

auth = JWTAuthentication()

class FriendChatConsumer(WebsocketConsumer):
	def connect(self):
		self.accept()
		self.user = None
	
	def disconnect(self, close_code):
		if (self.user is None):
			return 

		try:
			api.tmp.get(self.user, "friend-chat").remove(self)
		except:
			...

	def receive(self, text_data=None, bytes_data=None):
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
					api.tmp.set(self.user, "friend_chat", [self])
				else:
					lst.append(self)
				return self.send(bytes_data=b'\x01\x00')
			except:
				return self.send(bytes_data=b'\x01\x01')

		if (self.user is None):
			return 

		if (bytes_data[0] == 0x02):
			try:
				# do a request to bytes_data[1:] user
				name = bytes_data[1:].decode(encoding="utf-8")
				user2 = User.objects.filter(username=name).first()
				if (user2 is None):
					return self.send(bytes_data=b'\x02\x02') # not found ig
				if (self.user.username == user2.username):
					return self.send(bytes_data=b'\x02\x02') # not found ig

				frq = FriendRequest.objects.filter(from_who=self.user, to_who=user2).first()
				if (frq is not None):
					return self.send(bytes_data=b'\x02\x03') # already req

				if (self.user.id < user2.id):
					friend = Friendness.objects.filter(lesser=self.user, greater=user2).first()
				else:
					friend = Friendness.objects.filter(greater=self.user, lesser=user2).first()
				if friend is not None:
					return self.send(bytes_data=b'\x02\x04')

				
				FriendRequest.objects.create(from_who=self.user, to_who=user2, state=0)	
				
				return self.send(bytes_data=b'\x02\x00')

			except:
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
				user2 = User.objects.filter(username=name).first()
				if (user2 is None):
					return self.send(bytes_data=b'\x04\x02')

				frq = FriendRequest.objects.filter(from_who=user2, to_who=self.user).first()
				if (frq is None):
					return self.send(bytes_data=b'\x04\x02')
				frq.delete()
				if (self.user.id < user2.id):
					Friendness.objects.create(lesser=self.user, greater=user2)
				else:
					Friendness.objects.create(lesser=user2, greater=self.user)

				return self.send(bytes_data=b'\x04\x00')
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
