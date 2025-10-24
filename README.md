# EDUMARK — Automatic MCQ Grader

A multi-component system for scanning, recognising and automatically marking multiple-choice question (MCQ) sheets. This repository contains a modernized set of services and tooling that extend an older marking system (see `mcq_marking_old/`).

## Table of contents

- What this is
- Key components
- Quick start (Docker)
- Running services individually (dev)
- Tests
- Legacy system and migration notes

## What this is

MCQ-OCR is a modular project that combines computer-vision based answer-sheet detection and recognition with a marking backend and a frontend. It integrates components for:

- Detecting and segmenting answer regions from scanned sheets.
- Recognizing filled answers from segmented regions.
- Applying marking schemes to generate student results.
- A web frontend for uploading and reviewing scans.

The codebase is grouped into logical services to simplify development, testing and scaling.

## Key components (folders)

- `fastapi_backend/` — The primary backend implemented with FastAPI. Contains API endpoints, database integration, queueing, template generation and tests.
- `index_recognision/` — Index/recognition utilities and CV-based detectors and recognizers.
- `mcq_marking/` — The newer marking service used by the system (microservice / worker code).
- `mcq_marking_old/` — The original/legacy marking system we extended. Kept for reference and migration.
- `next_frontend/` — Next.js frontend for user interaction and uploads.
- `samples/` — Example templates, answer sheets and marking schemes used during development and testing.

There are test files under each service (for example, `fastapi_backend/tests/` and `index_recognision/test_*.py`).

## Quick start (recommended: Docker + docker-compose)

The repository includes a `docker-compose.yml` at the project root that defines the services used for local development. Docker is the fastest way to get all services up and running with minimal host setup.

Prerequisites

- Docker and Docker Compose installed on your machine.
- At least 4GB free RAM recommended for local development.

Start all services (from project root):

PowerShell
```
# build and start services in the background
docker-compose up --build -d

# view logs (optional)
docker-compose logs -f
```

Stop and remove containers:

PowerShell
```
docker-compose down
```

Notes

- Service names in the compose file may vary; inspect `docker-compose.yml` if you need to target a specific container (for example to run tests inside it).

## Running services individually (development)

If you prefer to run components locally without Docker, each service has its own dev instructions and dependencies. Typical steps for the Python services (example: `fastapi_backend`) are:

PowerShell (example for `fastapi_backend`)
```
# create venv
python -m venv .venv; .\.venv\Scripts\Activate.ps1

# install dependencies - the project uses pyproject.toml; choose pip or poetry per your workflow
pip install -U pip
pip install -r fastapi_backend/requirements.txt  # if present, or use poetry install inside the service folder

# run the backend
cd fastapi_backend; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

For `index_recognision`, follow the README inside that folder. It contains detector/recognizer scripts and tests.

## Tests

Most Python services include pytest tests. Example commands (from project root):

PowerShell
```
# run tests for backend
cd fastapi_backend; pytest -q

# run index_recognision tests
cd index_recognision; pytest -q
```

There are integration tests in several places that mock or use local resources — review the `pytest.ini` and `conftest.py` files in the service folders for specifics.

## Legacy system

The older system we extended is kept in `mcq_marking_old/`. That folder includes:

- historical scripts, notebooks and a `LICENSE` file for the original project files.
- migration references and sample CSV/student lists.

If you are migrating functionality or comparing behaviour, consult the files in `mcq_marking_old/` and the included `Automatic MCQ Grader.pdf` presentation that summarises the project design and decisions from the legacy system.

## Common workflows

- Mark a batch of scanned sheets: upload through the frontend or POST to backend API -> sheets are queued -> recognition worker(s) process images -> marking applied -> results stored in DB and available via API.
- Test a recognition model or detector locally: run the detector/recognizer scripts in `index_recognision/` with sample images from `samples/`.

## Notes / Where to find things quickly

- FastAPI backend: `fastapi_backend/`
- Recognition/detection: `index_recognision/`
- Marking workers: `mcq_marking/`
- Legacy system: `mcq_marking_old/`
- Frontend: `next_frontend/`

## Contact / Maintainers

Repository owner: VihangaMunasinghe[vihangamunasinghe.22@cse.mrt.ac.lk](mailto:vihangamunasinghe.22@cse.mrt.ac.lk).

— End of README —
