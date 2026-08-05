# Frontend

## Certificates
to create the certificates use 
```
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt -subj "/CN=localhost"
```
and out them into the `secrets` folder of the frontend
