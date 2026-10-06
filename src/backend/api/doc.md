
every request needs a json body if it is not ignored and Content-Type to be set to application/json

create account:
	method: POST
	path: /api/account/create
	body:
		"username": ...
		"password": ...
		"email": ...
	
	authentified: no
			
	response:
		400: missing field or invalid field value (weak password/invalid username)
		409: username already taken
		460: username invalid
		461: password too weak
		204: success no body

delete account:
	method: POST
	path: /api/account/delete
	body:
		ignored

	authentified: yes

	response:
		403: not authentified
		204: success without body
		202: deletion confirmation email sent


get profile:
	method: GET
	path: /api/account/profile?username=...
	body:
		ignored

	authentified: optional
	query:
		username: profile username to request (/self needs authentification)
	
	response:
		400: username query not set
		404: username not found
		401: /self was requested without being authentified
		200:
			json(!= /self): {
				"bio": ...
				"country": ... (as iso alpha2)
				"join_date": ... (as isoformat)
				"win_count": ...
				"loss_count": ...
				"placed": ...
				"streak": ...
				"elo": ...
			}
			json(== /self) {
				"username": ...
				"email": ...
				"emailed_confirmed": ...
			}

set info:
	method: POST
	path: /api/account/set-info
	body:
		"field": ...(field to set ("country" || "bio"))
		"value": ...
	
	authentified: yes

	response:
		401: not authentified
		400: missing field/value or invalid field/value
		204: success no body


get token from password:
	method: POST
	path: /api/token/
	body:
		"username": ...
		"password": ...
	
	authentified: no

	response:
		401/500: wrong credentials
		200:
			json: {
				"refresh": ...
				"access": ...
			}

get token from refresh token:
	method: POST
	path: /api/refresh/
	body:
		"refresh": ...
	
	authentified: no

	response:
		401/500: wrong refresh token
		200:
			json: {
				"refresh": ...
				"access": ...
			}

to authentifacte:
	set header "Authorization: bearer ..."
	token lasts 2 hours 
	redresh token lasts 30 days

ask confirmation email:
	method: GET
	path: /api/confirm-ask

	authentified: yes

	response:
		401: not authentified
		200: email already confirmed
		429: email already sent in the previous 1 hour
		204: email sent with token lasting 1 hour

confirm email:
	path: /api/account/confirm-mail
	method: GET
	query: username=... & token=...
	respons:
		403: invalid query
		400: expired
		204: success

get games history:
	path: /api/account/history
	method: GET

	response:
		403: not authentified
		200: [
			{
				"player1": ...
				"player2": ...
				"winner": ... (0: tie, 1: player1, 2: player2)
				"date": ... (as isoformat)
			}
			...
		]

get personnal data:
	path: /api/account/data
	method: GET
	note:
		if your email is confirmed the json response will also be sent as an email
	response:
		403: not authentified
		200:
			"username": ...
			"email": ...
			"games": ... (same format as history)
			"stats": {
				"win": ...
				"loss": ...
				"placed": ...
				"achievements":... (boolean list)
				"skin": ...
				"streak": ...
				"elo": ...
			}
			"friends": ... (string list)
			"messages": {
				"friend-name": [
					{
						"from": ...
						"to": ...
						"content": ...
					}
					...
				]
				...
			}
			"friend_request_sent": ... (string list)
			"friend_request_received": ... (string list)
			"bio": ...
			"country": ... (alpha-2 code)
			"join_date": ... (isoformat)


