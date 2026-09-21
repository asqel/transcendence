<<<<<<< Updated upstream
import api.common as common
import api.utils as utils

from django.contrib.auth.models import User
from django.db import IntegrityError

@common.endpoint("POST")
def create(request):
	entries = ["username", "password", "email"]
	infos = {}
	
	for i in entries:
		infos[i] = request.json.get(i, None)
		if (infos[i] is None):
			return common.error(f"Missing element {i}", 400)

	if (not utils.is_username_valid(infos["username"])):
		return common.error("Username invalid", 400)
	if (not utils.is_password_strong(infos["password"])):
		return common.error("Password to weak", 400)

	try:
		User.objects.create_user(**infos);

	except IntegrityError:
		return common.error("Username already taken", 409)
		
	return common.success("", 0)

import sys
@common.endpoint("POST")
def delete(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 403)
	request.user.delete()
	return common.success("", 0);

=======
import api.common as common
import api.utils as utils
import api.tmp as tmp_info
import sys
from models.apps import GHOST_NAME
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.utils import timezone
import pycountry

import secrets
import os

from django.contrib.auth.models import User
from django.db import IntegrityError
from models.models import Game, BIO_MAX_CHAR, Profile, Stats, EmailConfirm

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
	password_response = utils.is_password_strong(infos["password"], infos["username"], infos["email"])
	if (password_response):
		return common.error(password_response, 461)

	try:
		user = User.objects.create_user(**infos);
		Profile.objects.create(user=user, bio="", country="")
		Stats.objects.create(user=user)
		EmailConfirm.objects.create(user=user)

	except IntegrityError as e:
		utils.log(e)
		return common.error("Username already taken", 409)
		
	return common.success("", 0)

@common.endpoint("POST", need_json=False)
def delete(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 401)
	
	websocket = tmp_info.get(request.user, "websocket")
	if (websocket):
		websocket.close(close_code=1000)
	tmp_info.remove(request.user)
	
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
	username = request.GET.get("username", "/self")

	if (username == GHOST_NAME):
		return common.error("User not found", 404)
	if (username == "/self" and not request.user.is_authenticated):
		return common.error("Unauthorized", 401)
	if (username == "/self"):
		profile = Profile.objects.filter(user=request.user).first()
		return JsonResponse({"username": request.user.username, "email": request.user.email, "email_confirmed": profile.email_confirmed})
	
	user = User.objects.filter(username=username).first()
	if (user is None):
		return common.error("User not found", 404)

	profile = Profile.objects.filter(user=user).first()
	stats = Stats.objects.filter(user=user).first()
	res = {}
	res["bio"] = profile.bio
	res["country"] = profile.country
	res["join_date"] = profile.join_date.isoformat()
	res["win_count"] = stats.number_win
	res["loss_count"] = stats.number_loss
	res["placed"] = stats.number_placed
	res["streak"] = stats.streak
	res["elo"] = stats.elo
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
		if (len(value) > 100):
			return common.error(400, "Bio too long", 400)
		Profile.objects.filter(user=request.user).update(bio=value)
	elif (key == "country"):
		if (len(value) > 2 and (value == "LG" or pycountry.countries.get(alpha_2=value) is not None)):
			return common.error("Country identifier too long", 400)
		Profile.objects.filter(user=request.user).update(country=value)
	else:
		return common.error("Unknown field", 400)
	return common.success("", 204)

@common.endpoint("GET", need_json=False)
def ask_confirm_email(request):
	if (not request.user.is_authenticated):
		return common.error("Unauthorized", 401);
	
	profile = Profile.objects.filter(user=request.user).first()
	if (profile.email_confirmed):
		return common.success("Already confirmed", 200)
	
	email_confirm = EmailConfirm.objects.filter(user=request.user).first()
	email_confirm.token = secrets.token_urlsafe(32)
	email_confirm.expires_at = timezone.now() + timedelta(hours=6)
	email_confirm.save()
	try:
		send_mail(
			subject="Confirm you email",
			message=f"""
Hello {request.user.username},

Please click on the link to confirm your email address: https://{os.getenv('HOST_NAME')}/confirm-mail?token={email_confirm.token}&username={request.user.username}

This link expires in 6 hours.
		""",
			from_email=None,
			recipient_list=[request.user.email]
		)
	except:
		...
	return common.success("", 204)

@common.endpoint("GET", need_json=False)
def confirm_email(request):
	name = request.GET.get("username", None)
	token = request.GET.get("token", None)
	if (name is None or token is None):
		return common.error("Forbbiden", 403)
	
	user = User.objects.filter(username=name).first()
	profile = Profile.objects.filter(user=user).first()
	email_confirm = EmailConfirm.objects.filter(user=user).first()

	if (email_confirm.expires_at < timezone.now()):
		return common.error("Expired", 400)
	if (email_confirm.token != token):
		return common.error("Forbbiden", 403)
	
	email_confirm.expires_at = timezone.now();
	email_confirm.token = ""
	email_confirm.save()
	profile.email_confirmed = True
	profile.save()
	return common.success("", 204)
>>>>>>> Stashed changes
