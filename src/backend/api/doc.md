
every request needs a json body it is not ignored and Content-Type to be set to application/json

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
			}
			json(== /self) {
				"username": ...
				"email": ...
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
		401: wrong credentials
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
		401: wrong refresh token
		200:
			json: {
				"refresh": ...
				"access": ...
			}

to authentifacte:
	set header "Authorization: bearer ..."
	token lasts ... time
	redresh token lasts ... time
