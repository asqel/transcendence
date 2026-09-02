from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

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
	achievement = models.CharField(max_length=100, default=""*100)

class Friends(models.Model):
	lesser = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friend_lesser")
	greater = models.ForeignKey(User, on_delete=models.CASCADE, related_name="friend_greater")
	since_when = models.DateTimeField(default=timezone.now)

	class Meta:
		constraints = [
			models.UniqueConstraint(fields=["lesser", "greater"], name="unique_friend"),
			models.CheckConstraint(condition=Q(lesser__lt=models.F("greater")), name="lesser_id_smaller_than_greater_id")
		]
	
class FriendRequests(models.Model):
	from_who = models.ForeignKey(User, on_delete=models.CASCADE, related_name="from_who")
	to_who = models.ForeignKey(User, on_delete=models.CASCADE, related_name="to_who")
	sent_date = models.DateTimeField(default=timezone.now)
	is_rejected = models.BooleanField(default=False)
