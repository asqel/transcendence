import api.common as common
import api.utils as utils
import api.tmp as tmp_info
import api
import sys
from models.apps import GHOST_NAME
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.core.mail import EmailMessage
from django.utils import timezone
import pycountry
from django.http import JsonResponse, HttpResponse
import json

import secrets
import os

from django.contrib.auth.models import User
from django.db import IntegrityError
from models.models import Game, BIO_MAX_CHAR, Profile, Stats, EmailConfirm, Friendness, FriendMessage, FriendRequest, DeleteConfirm

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
		Profile.objects.create(user=user, bio="")
		Stats.objects.create(user=user)
		EmailConfirm.objects.create(user=user)
		DeleteConfirm.objects.create(user=user)

	except IntegrityError as e:
		utils.log(e)
		return common.error("Username already taken", 409)
		
	return common.success("", 0)

def real_delete(user):
	websocket = tmp_info.get(user, "websocket")
	if (websocket):
		websocket.close(close_code=1000)
	tmp_info.remove(user)

	ghost = utils.get_ghost()
	Profile.objects.filter(user=user).delete()
	Game.objects.filter(user1=user).update(user1=ghost)
	Game.objects.filter(user2=user).update(user2=ghost)
	Game.objects.filter(user1=ghost, user2=ghost).delete()
	Stats.objects.filter(user=user).delete()

	user.delete()

@common.endpoint("POST", need_json=False)
def delete(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 401)
	

	profile = Profile.objects.filter(user=request.user).first()
	if (profile and profile.email_confirmed):
		return do_delete_ask(request, request.user.email)

	real_delete(request.user)
	return common.success("", 0);

def do_delete_ask(request, email):
	delete_confirm = DeleteConfirm.objects.filter(user=request.user).first()
	delete_confirm.token = secrets.token_urlsafe(32)
	if (delete_confirm.expires_at + timedelta(hours=1) < timezone.now()):
		return common.error("too much request", 429)
	delete_confirm.expires_at = timezone.now() + timedelta(hours=6)
	delete_confirm.save()

	try:
		send_mail(
			subject="Account deletion",
			message=f"""
Hello {request.user.username},

Please click on the link to delete your account: https://{request.get_host()}/confirm-delete?token={delete_confirm.token}&username={request.user.username}

This link expires in 1 hour.
		""",
		from_email=None,
		recipient_list=[email]
		)
	except Exception as e:
		api.utils.log(e)
	return common.success("", 204)

def do_delete_confirm(request):
	name = request.GET.get("username", None)
	token = request.GET.get("token", None)
	if (name is None or token is None):
		return common.error("Forbbiden", 403)
	
	user = User.objects.filter(username=name).first()
	delete_confirm = DeleteConfirm.objects.filter(user=user).first()

	if (delete_confirm.expires_at < timezone.now()):
		return common.error("Expired", 400)
	if (delete_confirm.token != token):
		return common.error("Forbbiden", 403)
	
	delete_confirm.expires_at = timezone.now();
	delete_confirm.token = ""
	delete_confirm.save()

	real_delete(user)
	return common.success("", 204)

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
	if (type(value) != str):
		return common.error("Missing key 'value' or not a string", 400)

	if (key == "bio"):
		if (len(value) > 100):
			return common.error(400, "Bio too long", 400)
		Profile.objects.filter(user=request.user).update(bio=value)
	elif (key == "country"):
		if (len(value) > 2 and (value == "LG" or pycountry.countries.get(alpha_2=value) is not None)):
			return common.error("Country identifier too long", 400)
		if (value == "LG"):
			api.ach.gain(request.user, api.ach.ACH_FOUNTAIN)
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
	if (email_confirm.expires_at + timedelta(hours=1) < timezone.now()):
		return common.error("too much request", 429)
	email_confirm.expires_at = timezone.now() + timedelta(hours=6)
	email_confirm.save()
	try:
		send_mail(
			subject="Confirm you email",
			message=f"""
Hello {request.user.username},

Please click on the link to confirm your email address: https://{request.get_host()}/confirm-mail?token={email_confirm.token}&username={request.user.username}

This link expires in 1 hour.
		""",
		from_email=None,
		recipient_list=[request.user.email]
		)
	except Exception as e:
		api.utils.log(e)
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

@common.endpoint("GET", need_json=False)
def history(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 403)
	
	games = Game.objects.filter(Q(user1=request.user) | Q(user2=request.user))
	res = [
		{
			"player1": i.user1.username,
			"player2": i.user2.username,
			"winner": i.winner,
			"date": str(i.date),
		}
		for i in games
	]
	
	return JsonResponse(res, safe=False)

@common.endpoint("GET", need_json=False)
def get_data(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 403)
	games = Game.objects.filter(Q(user1=request.user) | Q(user2=request.user))
	stats = Stats.objects.filter(user=request.user).first()
	profile = Profile.objects.filter(user=request.user).first()
	friends = Friendness.objects.filter(Q(lesser=request.user) | Q(greater=request.user))
	friend_list = []
	for i in friends:
		if i.lesser.username == request.user.username:
			friend_list.append(i.greater.username)
		else:
			friend_list.append(i.lesser.username)
	
	friend_message = FriendMessage.objects.filter(Q(lesser=request.user) | Q(greater=request.user))
	message_dict = {}
	for i in friend_message:
		friend = i.lesser
		if (friend.username == request.user.username):
			friend = i.greater
		if friend.username not in message_dict:
			message_dict[friend.username] = []
		message = {}
		if i.is_from_leser:
			message["from"] = i.lesser.username
			message["to"] = i.greater.username
		else:
			message["to"] = i.lesser.username
			message["from"] = i.greater.username
		message["content"] = i.message
		message_dict[friend.username].append(message)
			


	data = {
		"username": request.user.username,
		"email": request.user.email,
		"games": [
			{
				"player1": i.user1.username,
				"player2": i.user2.username,
				"winner": i.winner,
				"date": str(i.date),
			}
			for i in games
		],
		"stats": {
			"win": stats.number_win,
			"loss": stats.number_loss,
			"placed": stats.number_placed,
			"achievements": [i == '1' for i in stats.achievement],
			"skin": stats.used_skin,
			"streak": stats.streak,
			"elo": stats.elo,
		},
		"friends": friend_list,
		"messages": message_dict,
		"friend_request_sent": [i.to_who for i in FriendRequest.objects.filter(from_who=request.user)],
		"friend_request_received": [i.from_who for i in FriendRequest.objects.filter(to_who=request.user)],
		"bio": profile.bio,
		"country": profile.country,
		"join_date": str(profile.join_date),
	}
	res = HttpResponse(json.dumps(data, ensure_ascii=False, indent=4), content_type="application/json")
	res["Content-Disposition"] = "attachment; filename=\"data.json\""
	if (profile.email_confirmed):
		email = EmailMessage(
			subject="Data Request",
			body=f"""
Hello {request.user.username},

To download your personal data see the attached file
		""",
			to=[request.user.email],

		)
		email.attach(
			"data.json", json.dumps(data, ensure_ascii=False, indent=4), "application/json"
		)
		try:
			email.send()
		except:
			...
		
	return res

