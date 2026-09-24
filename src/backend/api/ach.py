
"""
achivements:
	
	0: "create an account": coin.png
	+1
	0: "win verticaly" : arrow-up.png
	1: "find a secret": creature.png // un boutton cache ?
	2: "finish a game by a tie": equal.png
	3: "rematch at least five times in the game": infinity.png
	4: "win a game during the day": sun.png 
	5: "win a game to a forfeit": butterfly.png
	6: "have a 5 win streak": crown.png 
	7: "send a message in the non spectator chat": exclamation.png
	8: "win a game at night": moon.png
	9: "have 5 loose streak": poop.png
	10: "????": foutain.png
	11: "send a :3 in the non spectator chat": colon-three.png
	12: "send GG in the chat after loosing": cloud.png
	13: "have all the achivements": dots.png

"""

ACH_CREATE = 0 # The begining
ACH_VERT = 1 # Straight up
ACH_SECRET = 2 # A secret ?
ACH_TIE = 3 # Equality
ACH_INF = 4 # Neverending game
ACH_SUN = 5 # Sunny day
ACH_FORF = 6 # Fake win
ACH_WIN_STREAK = 7 # My king
ACH_EXCL = 8 # A real talker
ACH_MOON = 9 # Night bird
ACH_POOP = 10 # It's ok
ACH_FOUNTAIN = 11 # A real darkener
ACH_CUTE = 12 # Cute
ACH_GG = 13 # Fair play
ACH_ALL = 14 # You can rest now

ACH_COUNT = 15


import api.common as common
import api.utils as utils
import api
from models.apps import GHOST_NAME

from models.models import Stats
from django.http import JsonResponse
from django.contrib.auth.models import User

@common.endpoint("GET", need_json=False)
def get(request):
	username = request.GET.get("username", "/self")
	if (username == GHOST_NAME):
		return common.error("User not found", 404)
	
	user = None
	if (username == "/self"):
		if (not request.user.is_authenticated):
			return common.error("Unauthorized", 401)
		user = request.user
	else:
		user = user.objects.filter(username=username).first()
	
	if (user is None):
		return common.error("User not found", 404)
	
	stats = Stats.objects.filter(user=user).first()
	res = [False] * ACH_COUNT
	for i in range(ACH_COUNT):
		if stats.achievement[i] == '1':
			res[i] = True

	api.utils.log(res, stats.achievement, stats.user)
	return JsonResponse(res, safe=False)

@common.endpoint("POST")
def set_skin(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 401)
	skin = request.json.get("skin", None)
	if (skin is None):
		return common.error("Missing skin field", 400)
	if (skin < 0 or skin >= ACH_COUNT):
		return common.error("Invalid skin", 400)
	
	stats = Stats.objects.filter(user=request.user).first()
	if (stats.achievement[skin] != '1'):
		return common.error("Unauthorized", 403)
	
	stats.used_skin = skin
	stats.save()
	return common.success("", 204)

@common.endpoint("GET", need_json=False)
def get_skin(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 401)
	
	stats = Stats.objects.filter(user=request.user).first()
	return JsonResponse({"skin": stats.used_skin})

def gain(user, ach_id):
	stats = Stats.objects.filter(user=user).first()
	utils.log("AAAAAAAAAA", stats.achievement, ach_id)
	if (stats.achievement[ach_id] == '1'):
		return False
	
	api.notif.send_ach(user, ach_id)
	stats.achievement = stats.achievement[:ach_id] + '1' + stats.achievement[ach_id + 1:]
	if (stats.achievement.startswith('1' * (ACH_COUNT - 1))):
		stats.achievement = '1' * ACH_COUNT
		api.notif.send_ach(user, ACH_ALL)
	utils.log("IIIIIIIIIA", stats.achievement, ach_id)
	a = stats.save()
	utils.log("UUUUUUUUUUU", a, stats._state.db)
	stats = Stats.objects.filter(user=user).first()
	utils.log("ZZZZZZZZZ", stats.achievement, stats.user)
	return True
