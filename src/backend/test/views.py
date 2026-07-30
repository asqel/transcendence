from django.http import JsonResponse

def test(request):
	print("OH WAW UNE REQUET CEST DINGUE VRAIMENT")
	print(dir(request))

	return JsonResponse({
		"message": "CA MARCHE ET CEST UN JSON"
	})
