FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
WORKDIR /app

FROM base AS builder
RUN pip install --upgrade pip
COPY pyproject.toml ./
RUN pip install --prefix=/install \
      "fastapi>=0.115" \
      "uvicorn[standard]>=0.32" \
      "pydantic>=2.9" \
      "pydantic-settings>=2.6" \
      "amadeus>=11.0" \
      "tenacity>=9.0" \
      "cachetools>=5.5" \
      "diskcache>=5.6" \
      "httpx>=0.27"

FROM base AS dev
RUN pip install --upgrade pip
COPY pyproject.toml ./
RUN pip install \
      "fastapi>=0.115" \
      "uvicorn[standard]>=0.32" \
      "pydantic>=2.9" \
      "pydantic-settings>=2.6" \
      "amadeus>=11.0" \
      "tenacity>=9.0" \
      "cachetools>=5.5" \
      "diskcache>=5.6" \
      "httpx>=0.27" \
      "pytest>=8.3" \
      "pytest-asyncio>=0.24" \
      "ruff>=0.7" \
      "mypy>=1.13"
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM base AS runtime
COPY --from=builder /install /usr/local
COPY . .
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
