# Backend Dockerfile
FROM python:3.10-slim-bullseye
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

RUN chown -R appuser:appuser /app

EXPOSE 5001

USER appuser

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]