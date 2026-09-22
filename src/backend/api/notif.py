import api

def get_list(user) -> list:
	lst = api.tmp.get(user, "notif")
	if (lst is None):
		return []
	return lst

def send_ach(user, ach):
	for i in get_list(user):
		i.send_ach_notif(ach)

def send_friend_req(user, username):
	for i in get_list(user):
		i.send_friend_req(username)
	
def send_msg(user, username):
	for i in get_list(user):
		i.send_msg_notif(username)
	
def send_req_accept(to_who_name, from_who_name):
	to_who = User.objects.filter(username=to_who_name).first()
	from_who = User.objects.filter(username=from_who_name).first()
	if (to_who_name is None or from_who is None):
		return

	for i in get_list(to_who):
		i.send_req_accept(from_who)
