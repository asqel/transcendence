YML = src/docker-compose.yaml

all:
	docker compose -f $(YML) up
