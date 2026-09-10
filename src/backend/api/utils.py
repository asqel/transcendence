from django.contrib.auth.models import User
from models.apps import GHOST_NAME
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
import sys

def is_password_strong(password: str, username: str, email: str) -> list[str]: # returns the reasons
	return []
	try:
		validate_password(password, user=User(username, email))
		return []
	except ValidationError as e:
		return [i.code for i in e.error_list]
		

def is_username_valid(name: str):
	if (len(name) < 3 or len(name) > 12):
		return False

	if (name[0] == ' ' or  name[0] == '/' or name[-1] == ' '):
		return False
	
	for i in name:
		if (i in ":;'\"@" or ord(i) >= 127 or ord(i) < 32):
			return False
	if ("  " in name):
		return False
	
	return True

def get_ghost():
	return User.objects.get(username=GHOST_NAME)

def log(*args, **kwargs):
	print(*args, file=sys.stderr, **kwargs)
