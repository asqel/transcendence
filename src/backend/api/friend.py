import api
from django.contrib.auth.models import User
from models.models import FriendRequest, Friendness, FriendMessage

ERR_NONE = 0
ERR_GENERAL = 1
ERR_NOT_FOUND = 2
ERR_ALREADY_FRIEND = 3
ERR_ALREADY_SENT = 4
ERR_ALREADY_RECV = 5

def find_friendness(user1, user2):
	api.utils.log(user1, user2, "are they fwend", type(user1), type(user2))
	if user1.id < user2.id:
		return Friendness.objects.filter(lesser=user1, greater=user2).first()
	return Friendness.objects.filter(lesser=user2, greater=user1).first()

def send_request(self_user, username):
	user2 = User.objects.filter(username=username).first()
	if user2 is None:
		return ERR_NOT_FOUND

	friend = find_friendness(self_user, user2)
	if friend is not None:
		return ERR_ALREADY_FRIEND
	
	req = FriendRequest.objects.filter(from_who=self_user, to_who=user2).first()
	if req is not None:
		return ERR_ALREADY_SENT
	req = FriendRequest.objects.filter(from_who=user2, to_who=self_user).first()
	if req is not None:
		return ERR_ALREADY_SENT
	
	FriendRequest.objects.create(from_who=self_user, to_who=user2)
	api.notif.send_friend_req(user2, self_user.username)
	return ERR_NONE

def accept_request(self_user, username, do_accept):
	user2 = User.objects.filter(username=username).first()
	if user2 is None:
		return ERR_NOT_FOUND
	
	req = FriendRequest.objects.filter(from_who=user2, to_who=self_user).first()
	if req is None:
		return ERR_NOT_FOUND
	
	lesser = user2
	greater = self_user
	if self_user.id < user2.id:
		lesser = self_user
		greater = user2
	
	if do_accept:
		Friendness.objects.create(lesser=lesser, greater=greater)
	req.delete()
	return ERR_NONE

def inform_messsage(message, from_who, to_who):
	chat = api.tmp.get(to_who, "friend-chat")
	if chat:
		is_sent = False
		for i in chat:
			if i.talking_to and i.talking_to.id == from_who.id:
				i.send(bytes_data=b'\x07\x00\x01' + message.encode("utf-8"))
				is_sent = True
		if is_sent:
			return
	
	api.notif.send_msg(to_who, from_who.username)
