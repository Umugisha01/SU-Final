# ==============================================================================
# SU Connect Backend - Dockerfile
# Base: Python 3.12 Slim (Debian)
# ==============================================================================

FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000

# Set work directory
WORKDIR /app

# Install system dependencies
# - build-essential & libpq-dev: needed for compiling C-extensions & PostgreSQL support
# - libmagic1: required by python-magic for file type detection
# - curl & netcat-openbsd: useful for health checks and network diagnostics
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libmagic1 \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first to leverage Docker layer caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy entrypoint script and application source code
COPY entrypoint.sh /app/entrypoint.sh
COPY . /app/

# Create media and static directories
RUN mkdir -p /app/staticfiles /app/media

# Expose backend service port
EXPOSE 8000

# Set container entrypoint
ENTRYPOINT ["sh", "/app/entrypoint.sh"]

# Default command: ASGI server with Daphne (supports HTTP & real-time WebSockets)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "su_connect.asgi:application"]
