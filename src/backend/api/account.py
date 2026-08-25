import api.common as common
import api.utils as utils
import sys
from models.apps import GHOST_NAME
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q

from django.contrib.auth.models import User
from django.db import IntegrityError
from models.models import Game, BIO_MAX_CHAR, Profile, Stats

@common.endpoint("POST")
def create(request):
	entries = ["username", "password", "email"]
	infos = {}
	
	for i in entries:
		infos[i] = request.json.get(i, None)
		if (infos[i] is None or type(infos[i]) != str):
			return common.error(f"Missing element {i} or is not a string", 400)

	if (not utils.is_username_valid(infos["username"])):
		return common.error("Username invalid", 460)
	if (not utils.is_password_strong(infos["password"])):
		return common.error("Password to weak", 461)

	try:
		user = User.objects.create_user(**infos);
		Profile.objects.create(user=user, bio="", country="")
		Stats.objects.create(user=user)

	except IntegrityError:
		return common.error("Username already taken", 409)
		
	return common.success("", 0)

@common.endpoint("POST", need_json=False)
def delete(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 403)
	
	# !TODO check if the user is player if so disconnect them
	
	ghost = utils.get_ghost()
	Game.objects.filter(user1=request.user).update(user1=ghost)
	Game.objects.filter(user2=request.user).update(user2=ghost)
	Game.objects.filter(user1=ghost, user2=ghost).delete()
	Profile.objects.filter(user=request.user).delete()
	Stats.objects.filter(user=request.user).delete()


	request.user.delete()
	return common.success("", 0);

@common.endpoint("GET", need_json=False)
def profile(request):
	username = request.GET.get("username", None)
	if (not username):
		return common.error("query 'username' not set", 400);

	if (username == GHOST_NAME):
		return common.error("User not found", 404)
	if (username == "/self" and not request.user.is_authenticated):
		return common.error("Unauthorized", 401)
	if (username == "/self"):
		return JsonResponse({"username": request.user.username, "email": request.user.email})
	
	user = User.objects.filter(username=username).first()
	if (user is None):
		return common.error("User not found", 404)

	profile = Profile.objects.filter(user=user).first()
	res = {}
	res["bio"] = profile.bio
	res["country"] = profile.country
	res["join_date"] = profile.join_date.isoformat()
	return JsonResponse(res)


@common.endpoint("POST")
def set_info(request):
	if (not request.user.is_authenticated):
		return common.error("Unauthorized", 401);
	
	key = request.json.get("field", None)
	value = request.json.get("value", None)
	if (not key):
		return common.error("Missing key 'field'", 400)
	if (not value or type(value) != str):
		return commmon.error("Missing key 'value' or not a string", 400)

	if (key == "bio"):
		if (len(value) > BIO_MAX_CHAR):
			return common.error(400, "Bio too long", 400)
		Profile.objects.filter(user=request.user).update(bio=value)
	if (key == "country"):
		if (len(value) > COUNTRY_MAX_CHAR):
			return common.error("Country identifier too long", 400)
		Profile.objects.filter(user=request.user).update(country=value)
	else:
		return common.error("Unknown field", 400)
	return common.success("", 204)
