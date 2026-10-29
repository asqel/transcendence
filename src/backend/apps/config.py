from django.apps import AppConfig
import os
import threading
import time
import sys

def loop():
	import api
	from django.utils import timezone

	api.utils.log("THREAD STARTED")
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
		print("RUN_MAIN: ", os.environ.get("RUN_MAIN"), file=sys.stderr)
		if os.environ.get("RUN_MAIN") == "true" or os.environ.get("RUN_MAIN") is None:
			threading.Thread(target=loop, daemon=True).start()
