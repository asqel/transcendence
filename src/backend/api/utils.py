from django.contrib.auth.models import User
from models.apps import GHOST_NAME

def is_password_strong(password: str):
	# !TODO check that
	return True

def is_username_valid(name: str):
	if (len(name) < 3):
		return False
	if (not name[0].isprintable() or name[0] == ' ' or  name[0] == '/'):
		return False
	if (not name[-1].isprintable() or name[-1] == ' '):
		return False

	return True

def get_ghost():
	return User.objects.get(username=GHOST_NAME)
