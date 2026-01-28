# Docker commands for the FastAPI backend
# Load environment variables from .env file
include .env
export

.PHONY: help build up down logs shell test clean prod-up prod-down setup-dev setup-prod seed

# Default target
help:
	@echo "Available commands:"
	@echo "  setup-dev - Setup development environment"
	@echo "  setup-prod- Setup production environment"
	@echo "  build     - Build the Docker image"
	@echo "  up        - Start development environment"
	@echo "  down      - Stop development environment"
	@echo "  logs      - View logs"
	@echo "  shell     - Open shell in backend container"
	@echo "  test      - Run tests in container"
	@echo "  seed      - Run database seeding manually"
	@echo "  clean     - Clean up Docker resources"
	@echo "  prod-up   - Start production environment"
	@echo "  prod-down - Stop production environment"

# Setup commands
setup-dev:
	./setup-env.sh development

setup-prod:
	./setup-env.sh production

# Development commands
build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Backend available at: http://localhost:$(PORT)"
	@echo "API docs available at: http://localhost:$(PORT)/docs"
	@echo ""
	@echo "Note: Make sure PostgreSQL and Redis are running separately:"
	@echo "  PostgreSQL: $(DB_HOST):$(DB_PORT)"
	@echo "  Redis: Check your REDIS_URL setting"
	@echo ""
	@echo "Database seeding: $(SEED_DATABASE)"
	@echo "  To disable seeding: SEED_DATABASE=false make up"

down:
	docker-compose down

logs:
	docker-compose logs -f backend

shell:
	docker-compose exec backend /bin/bash

test:
	docker-compose exec backend python -m pytest tests/ -v

# Database seeding
seed:
	docker-compose exec backend python seed_postgres.py

# Production commands
prod-up:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "Production backend started"
	@echo "Backend available at: http://localhost:$(PORT)"

prod-down:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# Cleanup
clean:
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

# Quick development setup
dev: setup-dev build up
	@echo "Development environment is ready!"
	@echo "Run 'make logs' to see the logs"