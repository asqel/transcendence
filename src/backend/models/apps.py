from django.apps import AppConfig
import os

GHOST_NAME = "/deleted-user"

class config(AppConfig):
	default_auto_field = "django.db.models.BigAutoField"
	name = "models"

	def ready(self):
		if os.environ.get("RUN_MAIN") != "true":
			return
		from django.contrib.auth.models import User

		User.objects.get_or_create(username=GHOST_NAME, password="", email="") 
