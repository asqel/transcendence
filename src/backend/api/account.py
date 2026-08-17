import api.common as common
import api.utils as utils

from django.contrib.auth.models import User
from django.db import IntegrityError

@common.endpoint("POST")
def create(request):
	entries = ["username", "password", "email"]
	infos = {}
	
	for i in entries:
		infos[i] = request.json.get(i, None)
		if (infos[i] is None):
			return common.error(f"Missing element {i}", 400)

	if (not utils.is_username_valid(infos["username"])):
		return common.error("Username invalid", 400)
	if (not utils.is_password_strong(infos["password"])):
		return common.error("Password to weak", 400)

	try:
		User.objects.create_user(**infos);

	except IntegrityError:
		return common.error("Username already taken", 409)
		
	return common.success("", 0)

import sys
@common.endpoint("POST")
def delete(request):
	if (not request.user.is_authenticated):
		return common.error("Not authentified", 403)
	request.user.delete()
	return common.success("", 0);

