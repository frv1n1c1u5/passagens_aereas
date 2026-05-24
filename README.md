# Passagens Aéreas

Busca de passagens aéreas com **busca flexível** (matriz ±3 dias e mês mais barato), usando a Amadeus Self-Service API.

- **Backend**: FastAPI (Python 3.12) + Amadeus SDK
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + TanStack Query
- **Deploy**: `docker compose` local

## Pré-requisitos

- Docker + Docker Compose
- Credenciais Amadeus Self-Service (grátis em https://developers.amadeus.com)

## Quickstart

```bash
cp .env.example .env
# edite .env e preencha AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET

make dev          # sobe backend (:8000) e frontend (:3000) com hot reload
```

Abra http://localhost:3000.

Para rodar sem hot reload (modo "produção" local):

```bash
make up
```

## Endpoints da API

Base: `http://localhost:8000/api/v1`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Healthcheck |
| `GET` | `/locations?keyword=sao&limit=8` | Autocomplete de aeroportos/cidades |
| `POST` | `/offers/search` | Busca de voos (ida/volta ou só ida) |
| `POST` | `/offers/flex-matrix` | Matriz de preços ±N dias |
| `POST` | `/offers/cheapest-month` | Dia mais barato em um mês |

Docs interativas: http://localhost:8000/docs

## Estrutura

```
.
├── backend/                FastAPI
│   ├── app/
│   │   ├── routers/        endpoints REST
│   │   ├── services/       lógica de negócio + cliente Amadeus
│   │   ├── normalizers/    payload Amadeus -> schema interno
│   │   └── schemas/        modelos Pydantic
│   └── tests/
└── frontend/               Next.js
    └── src/
        ├── app/            rotas
        ├── components/     UI
        ├── hooks/          TanStack Query hooks
        └── lib/            api client, formatadores
```

## Notas de design

- **Sem conversão manual de moeda**: passamos `currencyCode` direto no Amadeus.
- **Ida e volta separadas** na UI — escalas exibidas por trecho, não somadas.
- **Busca flexível com fallback**: tentamos `flight_dates` primeiro; se a sandbox não cobrir a O&D, fazemos varredura paralela com `flight_offers_search` (banda diagonal para round-trip, limitando combinações).
- **Cache**: locations 7d em disco; offers 5min em memória; flex/mês 1h.
- **Sem CORS**: o frontend chama `/api/*` no próprio Next, que faz rewrite para o backend dentro da rede Docker.

## Testes e lint

```bash
make backend-test     # pytest
make backend-lint     # ruff + mypy
make frontend-lint    # eslint + tsc --noEmit
```

## Limitações conhecidas (sandbox Amadeus)

- `cheapest-month` faz ~30 chamadas paralelas — sandbox pode rate-limitar e retornar resultado parcial.
- `flight_dates` (endpoint nativo) cobre poucas O&D; fallback resolve, mas é mais lento.
- Preços e disponibilidade são do sandbox, não são reais para venda.
