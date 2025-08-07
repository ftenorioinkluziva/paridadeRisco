# Backend Dockerfile - Versão Simples (funcional)
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
RUN chown -R appuser:appuser /app

EXPOSE 5001

USER appuser

# Comando direto baseado na variável RUN_MODE
CMD ["sh", "-c", "if [ \"$RUN_MODE\" = 'scheduler-only' ]; then python scheduler_docker.py; elif [ \"$RUN_MODE\" = 'api-only' ]; then python app.py; else python app_with_scheduler.py; fi"]