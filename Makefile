YML = src/docker-compose.yaml
DOCK_CMD = docker compose -f $(YML)

all: run-background

run-background:
	$(DOCK_CMD) up -d

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

status:
	$(DOCK_CMD) ps

build:
	$(DOCK_CMD) build

re:
	$(DOCK_CMD) down
	$(DOCK_CMD) up --build -d

.PHONY: all run-background run-foreground stop clean logs status build re block
