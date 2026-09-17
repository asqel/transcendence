<<<<<<< Updated upstream
YML = src/docker-compose.yaml
DOCK_CMD = docker compose -f $(YML)

all: run-background

run-background:
	$(DOCK_CMD) up -d

frontend:
	$(DOCK_CMD) up frontend

run-foreground:
	$(DOCK_CMD) up --abort-on-container-exit

build:
	$(DOCK_CMD) build

block: run-foreground

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

.PHONY: all run-background run-foreground stop clean logs status build re block
=======
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
>>>>>>> Stashed changes
