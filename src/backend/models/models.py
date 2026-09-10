from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

BIO_MAX_CHAR = 1000
COUNTRY_MAX_CHAR = 2

class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
	bio = models.CharField(max_length=BIO_MAX_CHAR, blank=True)
	country = models.CharField(max_length=COUNTRY_MAX_CHAR, default="FR")
	join_date = models.DateTimeField(default=timezone.now)
	email_confirmed = models.BooleanField(default=False)

class Game(models.Model):
	# protect so cannot delete user if there are games (put them to ghost)
	user1 = models.ForeignKey(User, on_delete=models.PROTECT, related_name="games_as_player1")
	user2 = models.ForeignKey(User, on_delete=models.PROTECT, related_name="games_as_player2")

	winner = models.IntegerField(choices=[(0, "draw"), (1, "player 1"), (2, "player 2"),], default=0)

	date = models.DateTimeField(default=timezone.now)

class Stats(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="stats")

	number_win = models.IntegerField(default=0)
	number_loss = models.IntegerField(default=0)
	number_placed = models.IntegerField(default=0) # ++ when placing a coin
	achievement = models.CharField(max_length=100, default='1' + ("0" * 49))
	used_skin = models.IntegerField(default=0)
	streak = models.IntegerField(default=0)
	elo = models.IntegerField(default=100)

class EmailConfirm(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_confirm")
	token = models.CharField(max_length=100, default="")
	expires_at = models.DateTimeField(default=timezone.now)
