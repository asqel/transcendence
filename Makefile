YML = src/docker-compose.yaml
YML_DEV = src/docker-compose-dev.yaml
DOCK_CMD = docker compose -f $(YML)
DOCK_CMD_DEV = docker compose -f $(YML) -f $(YML_DEV)

all: run

run:
	$(DOCK_CMD) up -d

frontend:
	$(DOCK_CMD) up frontend

dev-front:
	$(DOCK_CMD_DEV) up frontend

build:
	$(DOCK_CMD) build

stop:
	$(DOCK_CMD) down

clean:
	$(DOCK_CMD) down --rmi local

logs:
	$(DOCK_CMD) logs -f

logs-front:
	$(DOCK_CMD) logs -f frontend

status:
	$(DOCK_CMD) ps

re:
	$(DOCK_CMD) down
	$(DOCK_CMD) up --build -d

.PHONY: all run-background run-foreground stop clean logs status build re block dev