from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

"""
profile:
	bio: 1k char
	country: 2 char (FR/US/...) alpha-2 ? je crois
	join_date: ???

game:
	user1: str
	user2: str
	who_win: int (0: None, 1, 2)
	time length: ???
	date: ???

stats:
	number_win: int
	number_loose: int
	number_placed: int
	
"""

BIO_MAX_CHAR = 1000
COUNTRY_MAX_CHAR = 2

class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
	bio = models.CharField(max_length=BIO_MAX_CHAR, blank=True)
	country = models.CharField(max_length=COUNTRY_MAX_CHAR, blank=True)
	join_date = models.DateTimeField(default=timezone.now)

class Game(models.Model):
	# protect so cannot delete user if there are games (put them to ghost)
	user1 = models.ForeignKey(User, on_delete=models.PROTECT, related_name="games_as_player1")
	user2 = models.ForeignKey(User, on_delete=models.PROTECT, related_name="games_as_player2")

	winner = models.IntegerField(choices=[(0, "draw"), (1, "player 1"), (2, "player 2"),], default=0)

	duration = models.IntegerField() # as seconds probly
	date = models.DateTimeField(default=timezone.now)

class Stats(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="stats")

	number_win = models.IntegerField(default=0)
	number_loss = models.IntegerField(default=0)
	number_placed = models.IntegerField(default=0) # ++ when placing a coin
