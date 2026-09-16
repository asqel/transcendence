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
