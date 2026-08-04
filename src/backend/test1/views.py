from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

@csrf_exempt # sinon les cookies crients (aled)
def test(request):
	try:
		data = json.loads(request.body)
		name = data.get("name", None)
		mail = data.get("mail", None)
		passwd = data.get("passwd", None)
		if name and mail and passwd:
			User.objects.create_user(name, mail, passwd)
		if name and passwd:
			user = authenticate(username=name, password=passwd)
			return JsonResponse({
				"message": str(user)
			})
		return JsonResponse({
			"message": str(data)
		})

	except Exception as e:
		return JsonResponse({

			"message": str(e)
		})
