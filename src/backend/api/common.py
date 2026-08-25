from functools import wraps
import json
import sys

from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.http import HttpResponse

def error(msg: str, status: int):
	if (type(msg) != str):
		raise TypeError("msg must be a string")
	if (type(status) != int):
		raise TypeError("status must be a status")
	return JsonResponse({"detail": msg}, status=status)

def success(msg: str, status: int):
	if not msg:
		return HttpResponse(status=204)
	if (type(msg) != str):
		raise TypeError("msg must be a string")
	if (type(status) != int):
		raise TypeError("status must be a status")
	return JsonResponse({"message": msg}, status=status)

def endpoint(*methods, need_json=True):
	def decorator(func):

		func = csrf_exempt(func)
		func  = api_view([*methods])(func)

		@wraps(func)
		def wrapper(request, *args, **kwargs):
			if (request.method != "GET"):
				if (request.content_type != "application/json" and need_json):
					return error("Content-Type must be application/json", 415)

				try:
					if (need_json):
						request.json = json.loads(request.body)

				except json.JSONDecodeError as e:
					return error("Invalid JSON", 400)
				
			return func(request, *args, **kwargs)

		return wrapper
	return decorator
