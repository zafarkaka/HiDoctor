# ===============================
# HiDoctor Backend Dockerfile
# ===============================
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

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/api/health')" || exit 1

# Run with gunicorn using uvicorn workers
CMD ["gunicorn", "server:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8001", "--timeout", "120"]
