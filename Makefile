.PHONY: help dev up down build logs test lint backend-test backend-lint frontend-lint clean

help:
	@echo "make up        - docker compose up (production-like)"
	@echo "make dev       - docker compose up with hot reload"
	@echo "make down      - stop and remove containers"
	@echo "make build     - rebuild images"
	@echo "make logs      - tail logs"
	@echo "make test      - run all tests"
	@echo "make lint      - run all linters"

up:
	docker compose -f docker-compose.yml up --build

dev:
	docker compose up --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

test: backend-test

backend-test:
	cd backend && python -m pytest -q

backend-lint:
	cd backend && ruff check app tests && ruff format --check app tests && mypy app

frontend-lint:
	cd frontend && npm run lint && npm run typecheck

lint: backend-lint frontend-lint

clean:
	docker compose down -v
	rm -rf backend/.pytest_cache backend/.ruff_cache backend/.mypy_cache
	rm -rf frontend/.next frontend/node_modules
