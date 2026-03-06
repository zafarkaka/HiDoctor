# ===============================
# HiDoctor Backend Dockerfile
# ===============================
# Force Rebuild: 2026-03-06 17:15
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONPATH=/app

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  gcc \
  libffi-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -U pip && \
  pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Run with gunicorn using uvicorn workers
# Use the $PORT environment variable provided by Railway (defaults to 8001 if not set)
CMD sh -c "gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8001} --timeout 120"
