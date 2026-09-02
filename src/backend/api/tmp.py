
tmp_infos : dict[any, dict] = {} # user -> dict

def get(user, key: str, do_create=True):
	global tmp_infos
	if (not user):
		return None

	info = tmp_infos.get(user.id, None)
	if (info is None and do_create):
		tmp_infos[user.id] = {}
		return None
	val = info.get(key, None)
	return val

def set(user, key: str, val: any):
	global tmp_infos

	info = tmp_infos.get(user.id, None)
	if (info is None):
		info = {}
		tmp_infos[user.id] = info
	
	info[key] = val

def remove(user):
	global tmp_infos

	if (user.id in tmp_infos):
		del tmp_infos[user.id]
