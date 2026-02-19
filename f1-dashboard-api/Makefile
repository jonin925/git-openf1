.PHONY: help build up down dev prod logs shell migrate clean

# Default environment
ENV ?= dev

help: ## Show this help message
	@echo "F1 Dashboard - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo "Building Docker images..."
ifeq ($(ENV),prod)
	docker-compose build
else
	docker-compose -f docker-compose.dev.yml build
endif

up: ## Start all services
	@echo "Starting services..."
ifeq ($(ENV),prod)
	docker-compose up -d
else
	docker-compose -f docker-compose.dev.yml up -d
endif

down: ## Stop all services
	@echo "Stopping services..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

dev: ## Start development environment
	@echo "Starting development environment..."
	$(MAKE) ENV=dev up

prod: ## Start production environment
	@echo "Starting production environment..."
	$(MAKE) ENV=prod up

logs: ## View logs from all services
	docker-compose -f docker-compose.dev.yml logs -f

logs-api: ## View API logs only
	docker-compose -f docker-compose.dev.yml logs -f api

logs-db: ## View database logs only
	docker-compose -f docker-compose.dev.yml logs -f postgres

shell-api: ## Open shell in API container
	docker-compose -f docker-compose.dev.yml exec api sh

shell-db: ## Open PostgreSQL shell
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d f1dashboard_dev

migrate: ## Run database migrations
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d f1dashboard_dev -f /docker-entrypoint-initdb.d/001_initial_schema.sql

sync-2025: ## Sync 2025 season data
	curl -X POST http://localhost:3001/api/years/2025/sync

clean: ## Remove all containers and volumes
	@echo "Cleaning up..."
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

status: ## Check container status
	docker-compose -f docker-compose.dev.yml ps

update: ## Pull latest images and rebuild
	docker-compose -f docker-compose.dev.yml pull
	docker-compose -f docker-compose.dev.yml build --no-cache
	docker-compose -f docker-compose.dev.yml up -d