import api.common as common
from django.contrib.auth.models import User
from models.models import Stats
from django.http import JsonResponse

@common.endpoint("GET", need_json=False)
def get(request):
	board = Stats.objects.select_related("user").order_by("-elo", "user_id")[:10]
	
	rank = None
	if (request.user.is_authenticated):
		stats = Stats.objects.get(user=request.user)
		rank = Stats.objects.filter(elo__gt=stats.elo).count() + 1
	res = {
		"self": rank,
		"board": [
			[i.user.username, i.elo] for i in board
		]
	}

	return JsonResponse(res)
