from django.apps import AppConfig
import os
import threading
import time
import sys

def loop():
	import api
	from django.utils import timezone

	while 1:
		for i in api.game.games :
			game = api.game.games[i]
			if game.ai : 
				with game.lock :
					if game.ai_should and timezone.now() > game.ai_time :
						game.on_ai_place()
						game.ai_should = False
		time.sleep(0.75)

class config(AppConfig):
	name = "apps"

	def ready(self):
		if os.environ.get("RUN_MAIN") != "true":
			return

		threading.Thread(target=loop, daemon=True).start()
