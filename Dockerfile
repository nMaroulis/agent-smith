# ===========================
# Backend
# ===========================
FROM python:3.13-slim as backend

# Install UV and other tools
RUN apt-get update && apt-get install -y curl git build-essential && \
    curl -Ls https://astral.sh/uv/install.sh | bash

WORKDIR /app/backend

# Copy only relevant files to speed up build cache
COPY backend/pyproject.toml backend/uv.lock .

# Install Python deps via uv
RUN uv pip install -r requirements.txt

# Copy backend source
COPY backend .

# ===========================
# Frontend
# ===========================
FROM node:20-alpine as frontend

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend .
RUN npm run build

# ===========================
# Final stage: run FastAPI and serve frontend
# ===========================
FROM python:3.13-slim

# Copy backend from first stage
COPY --from=backend /app/backend /app/backend

# Copy frontend static build
COPY --from=frontend /app/frontend/dist /app/backend/static

WORKDIR /app/backend

# Reinstall uv
RUN curl -Ls https://astral.sh/uv/install.sh | bash

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
