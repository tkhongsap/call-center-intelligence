# Call Center Intelligence - Docker Management
.PHONY: help build up down logs clean dev prod restart status health

# Default target
help: ## Show this help message
	@echo "Call Center Intelligence - Docker Management"
	@echo "============================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
dev: ## Start development environment
	docker-compose up -d
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000"
	@echo "Backend Docs: http://localhost:8000/docs"

dev-build: ## Build and start development environment
	docker-compose up -d --build

dev-logs: ## Show development logs
	docker-compose logs -f

# Production commands
prod: ## Start production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "Production environment started!"

prod-build: ## Build and start production environment
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

prod-logs: ## Show production logs
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# General commands
build: ## Build all services
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

status: ## Show service status
	docker-compose ps

logs: ## Show logs for all services
	docker-compose logs -f

# Individual service commands
backend-logs: ## Show backend logs
	docker-compose logs -f backend

frontend-logs: ## Show frontend logs
	docker-compose logs -f frontend

db-logs: ## Show database logs
	docker-compose logs -f postgres

redis-logs: ## Show Redis logs
	docker-compose logs -f redis

nginx-logs: ## Show Nginx logs
	docker-compose logs -f nginx

# Health and debugging
health: ## Check health of all services
	@echo "Checking service health..."
	@docker-compose ps
	@echo "\nBackend health:"
	@curl -s http://localhost:8000/health || echo "Backend not responding"
	@echo "\nFrontend health:"
	@curl -s http://localhost:3000/api/health || echo "Frontend not responding"

shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

shell-db: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d call_center_db

# Database commands
db-migrate: ## Run database migrations
	docker-compose exec backend python -m alembic upgrade head

db-seed: ## Seed database with sample data
	docker-compose exec backend python seed_postgres.py

db-reset: ## Reset database (WARNING: This will delete all data)
	docker-compose down -v
	docker-compose up -d postgres redis
	sleep 10
	docker-compose up -d backend
	sleep 5
	$(MAKE) db-migrate
	$(MAKE) db-seed

# Cleanup commands
clean: ## Stop and remove all containers, networks, and volumes
	docker-compose down -v --remove-orphans
	docker system prune -f

clean-all: ## Remove everything including images
	docker-compose down -v --remove-orphans --rmi all
	docker system prune -af

# Backup and restore
backup-db: ## Backup database
	@mkdir -p backups
	docker-compose exec postgres pg_dump -U postgres call_center_db > backups/db_backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Database backup created in backups/ directory"

restore-db: ## Restore database from backup (usage: make restore-db BACKUP=filename.sql)
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make restore-db BACKUP=filename.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U postgres call_center_db < backups/$(BACKUP)
	@echo "Database restored from $(BACKUP)"

# Development utilities
install-frontend: ## Install frontend dependencies
	cd call_center_intelligence_frontend && npm install

install-backend: ## Install backend dependencies
	cd call_center_intelligence_backend && pip install -r requirements.txt

lint-frontend: ## Lint frontend code
	cd call_center_intelligence_frontend && npm run lint

lint-backend: ## Lint backend code
	cd call_center_intelligence_backend && python -m flake8 app/

test-frontend: ## Run frontend tests
	cd call_center_intelligence_frontend && npm test

test-backend: ## Run backend tests
	cd call_center_intelligence_backend && python -m pytest

# Environment setup
setup: ## Initial setup - copy environment files
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env file from .env.example"; fi
	@echo "Please edit .env file with your configuration"
	@echo "Then run: make dev"