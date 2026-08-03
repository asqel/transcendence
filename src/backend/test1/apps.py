from django.apps import AppConfig
import os
import threading
import time
import sys

var = 0

def loop():
	global var
	print(f"LA THREAD {var}", file=sys.stderr, flush=True)
	var += 1
	while 1:
		print(f"LA THREAD", file=sys.stderr, flush=True)
		time.sleep(60)

class config(AppConfig):
    name = "test1"

    def ready(self):
        if os.environ.get("RUN_MAIN") != "true":
            return

        threading.Thread(target=loop, daemon=True).start()
